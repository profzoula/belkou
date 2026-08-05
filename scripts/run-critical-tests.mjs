import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");

function expectIncludes(source, snippet, context) {
  assert.ok(source.includes(snippet), `${context} is missing expected guard: ${snippet}`);
}

function run() {
  const webhook = read("src/routes/api/stripe/webhook.ts");
  const stripeAccess = read("src/server/stripe-access.ts");
  const adminAuth = read("src/lib/admin-auth.ts");
  const checkout = read("src/lib/fns/register.ts");

  // Stripe webhook hardening guards
  expectIncludes(webhook, "event.type === \"checkout.session.completed\"", "webhook");
  expectIncludes(webhook, "event.type === \"checkout.session.async_payment_succeeded\"", "webhook");
  expectIncludes(webhook, "requireRegistrationMetadata: true", "webhook strict mode");
  expectIncludes(webhook, "requireAmountAndCurrencyMatch: true", "webhook strict mode");
  expectIncludes(webhook, "stripe_webhook_events", "webhook idempotency");

  // Access grant/payment integrity guards
  expectIncludes(stripeAccess, "hasExpectedStripePricingForSession", "stripe access pricing");
  expectIncludes(stripeAccess, "options.requireAmountAndCurrencyMatch", "stripe access strict option");
  expectIncludes(stripeAccess, "updateRegistrationPayment", "stripe grant update");

  // Admin session controls
  expectIncludes(adminAuth, "crypto.subtle.importKey", "admin auth HMAC");
  expectIncludes(adminAuth, "SameSite=Lax", "admin cookie flags");
  expectIncludes(adminAuth, "HttpOnly", "admin cookie flags");

  // Checkout verification path still exists
  expectIncludes(checkout, "verifyStripeSession", "checkout verify flow");
  expectIncludes(checkout, "grantAccessFromCheckoutSession", "checkout grant flow");

  console.log("[BelKou] Critical path guards validated.");
}

try {
  run();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("[BelKou] Critical test failed:", message);
  process.exit(1);
}
