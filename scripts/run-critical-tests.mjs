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

  // Runtime assertions (behavior) for auth/session primitives.
  // Other critical guards are validated structurally below.

  const token = await adminAuth.createAdminToken("admin-user", "test-secret");
  const username = await adminAuth.verifyAdminSessionToken(token, "test-secret");
  assert.equal(username, "admin-user");
  const cookieHeader = adminAuth.adminCookieHeader(token, true);
  assert.match(cookieHeader, /HttpOnly/);
  assert.match(cookieHeader, /SameSite=Lax/);
  assert.match(cookieHeader, /Secure/);

  // Static structural guards (defense-in-depth)
  const webhook = read("src/routes/api/stripe/webhook.ts");
  const stripeAccessSource = read("src/server/stripe-access.ts");
  const adminAuthSource = read("src/lib/admin-auth.ts");
  const checkout = read("src/lib/fns/register.ts");

  // Stripe webhook hardening guards
  expectIncludes(webhook, "event.type === \"checkout.session.completed\"", "webhook");
  expectIncludes(webhook, "event.type === \"checkout.session.async_payment_succeeded\"", "webhook");
  expectIncludes(webhook, "stripe-webhook-idempotency", "webhook idempotency module");
  expectIncludes(webhook, "requireRegistrationMetadata: true", "webhook strict mode");
  expectIncludes(webhook, "requireAmountAndCurrencyMatch: true", "webhook strict mode");
  const idempotency = read("src/server/stripe-webhook-idempotency.ts");
  expectIncludes(idempotency, "stripe_webhook_events", "webhook idempotency");

  // Access grant/payment integrity guards
  expectIncludes(stripeAccessSource, "hasExpectedStripePricingForSession", "stripe access pricing");
  expectIncludes(stripeAccessSource, "options.requireAmountAndCurrencyMatch", "stripe access strict option");
  expectIncludes(stripeAccessSource, "updateRegistrationPayment", "stripe grant update");

  // Admin session controls
  expectIncludes(adminAuthSource, "crypto.subtle.importKey", "admin auth HMAC");
  expectIncludes(adminAuthSource, "SameSite=Lax", "admin cookie flags");
  expectIncludes(adminAuthSource, "HttpOnly", "admin cookie flags");

  // Checkout verification path still exists
  expectIncludes(checkout, "verifyStripeSession", "checkout verify flow");
  expectIncludes(checkout, "grantAccessFromCheckoutSession", "checkout grant flow");

  console.log("[BelKou] Critical runtime tests passed.");
}

try {
  await run();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("[BelKou] Critical test failed:", message);
  process.exit(1);
}
