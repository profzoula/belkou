import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");

function expectIncludes(source, snippet, context) {
  assert.ok(source.includes(snippet), `${context} is missing expected guard: ${snippet}`);
}

async function run() {
  const adminAuth = await import("../src/lib/admin-auth.ts");
  const { hasExpectedStripePricingForSession } = await import("../src/lib/stripe-pricing.ts");

  // Runtime assertions (behavior) for auth/session primitives.
  // Other critical guards are validated structurally below.

  const token = await adminAuth.createAdminToken("admin-user", "test-secret");
  const username = await adminAuth.verifyAdminSessionToken(token, "test-secret");
  assert.equal(username, "admin-user");
  const cookieHeader = adminAuth.adminCookieHeader(token, true);
  assert.match(cookieHeader, /HttpOnly/);
  assert.match(cookieHeader, /SameSite=Lax/);
  assert.match(cookieHeader, /Secure/);

  // A checkout may only unlock access for the exact price we quoted, or for that price
  // minus a discount Stripe itself reports. Anything else is someone paying less.
  const quoted = {
    mode: "payment",
    amount_total: 19900,
    currency: "usd",
    metadata: { expectedAmountCents: "19900", expectedCurrency: "USD" },
  };
  assert.equal(hasExpectedStripePricingForSession(quoted), true);
  assert.equal(hasExpectedStripePricingForSession({ ...quoted, amount_total: 29900 }), false);
  assert.equal(hasExpectedStripePricingForSession({ ...quoted, currency: "eur" }), false);
  assert.equal(hasExpectedStripePricingForSession({ ...quoted, mode: "subscription" }), false);

  const credited = { ...quoted, amount_total: 18901, total_details: { amount_discount: 999 } };
  assert.equal(hasExpectedStripePricingForSession(credited), true);
  assert.equal(
    hasExpectedStripePricingForSession({ ...credited, total_details: { amount_discount: 0 } }),
    false,
    "a shortfall with no Stripe discount must never unlock access",
  );
  assert.equal(
    hasExpectedStripePricingForSession({ ...credited, total_details: { amount_discount: 500 } }),
    false,
    "a discount that does not reconcile must never unlock access",
  );

  // Static structural guards (defense-in-depth)
  const webhook = read("src/routes/api/stripe/webhook.ts");
  const stripeAccessSource = read("src/server/stripe-access.ts");
  const adminAuthSource = read("src/lib/admin-auth.ts");
  const checkout = read("src/lib/fns/register.ts");

  // Stripe webhook hardening guards
  expectIncludes(webhook, 'event.type === "checkout.session.completed"', "webhook");
  expectIncludes(webhook, 'event.type === "checkout.session.async_payment_succeeded"', "webhook");
  expectIncludes(webhook, "stripe-webhook-idempotency", "webhook idempotency module");
  expectIncludes(webhook, "requireRegistrationMetadata: true", "webhook strict mode");
  expectIncludes(webhook, "requireAmountAndCurrencyMatch: true", "webhook strict mode");
  const idempotency = read("src/server/stripe-webhook-idempotency.ts");
  expectIncludes(idempotency, "stripe_webhook_events", "webhook idempotency");

  // Access grant/payment integrity guards
  expectIncludes(stripeAccessSource, "hasExpectedStripePricingForSession", "stripe access pricing");
  expectIncludes(
    stripeAccessSource,
    "options.requireAmountAndCurrencyMatch",
    "stripe access strict option",
  );
  expectIncludes(stripeAccessSource, "updateRegistrationPayment", "stripe grant update");

  // Admin session controls
  expectIncludes(adminAuthSource, "crypto.subtle.importKey", "admin auth HMAC");
  expectIncludes(adminAuthSource, "SameSite=Lax", "admin cookie flags");
  expectIncludes(adminAuthSource, "HttpOnly", "admin cookie flags");

  // Checkout verification path still exists
  expectIncludes(checkout, "verifyStripeSession", "checkout verify flow");
  expectIncludes(checkout, "grantAccessFromCheckoutSession", "checkout grant flow");

  const railway = read("scripts/railway.mjs");
  expectIncludes(railway, "Strict-Transport-Security", "railway HSTS");
  expectIncludes(railway, "Content-Security-Policy", "railway CSP");
  expectIncludes(railway, "applySecurityHeaders", "railway security header apply");

  const securityHeaders = read("src/lib/security-headers.ts");
  expectIncludes(securityHeaders, "X-Frame-Options", "app frame options");
  expectIncludes(securityHeaders, "Permissions-Policy", "app permissions policy");

  const liveAdmin = read("src/lib/fns/live.ts");
  expectIncludes(liveAdmin, "adminSetLiveSessionSchedule", "admin live reschedule");
  expectIncludes(liveAdmin, "scheduledAt: scheduled.toISOString()", "admin live reschedule persist");

  const pixel = read("src/lib/meta-pixel.ts");
  expectIncludes(pixel, "connect.facebook.net", "meta pixel script");
  const siteCfg = read("src/lib/site-config.ts");
  expectIncludes(siteCfg, "998362493224687", "meta pixel id");

  console.log("[BelKou] Critical runtime tests passed.");
}

try {
  await run();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("[BelKou] Critical test failed:", message);
  process.exit(1);
}
