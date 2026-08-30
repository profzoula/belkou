import test from "node:test";
import assert from "node:assert/strict";
import {
  grantAccessFromCheckoutSession,
  hasExpectedCheckoutPricing,
  isCheckoutPaid,
} from "../src/server/checkout-access.ts";

test("isCheckoutPaid accepts paid and no_payment_required", () => {
  assert.equal(isCheckoutPaid({ id: "ord_1", payment_status: "paid" }), true);
  assert.equal(isCheckoutPaid({ id: "ord_2", payment_status: "no_payment_required" }), true);
  assert.equal(isCheckoutPaid({ id: "ord_3", payment_status: "unpaid" }), false);
});

test("hasExpectedCheckoutPricing validates amount and currency", () => {
  const baseSession = {
    id: "ord_ok",
    mode: "payment",
    amount_total: 19900,
    currency: "usd",
    metadata: {
      expectedAmountCents: "19900",
      expectedCurrency: "USD",
    },
  };

  assert.equal(hasExpectedCheckoutPricing(baseSession), true);
  assert.equal(hasExpectedCheckoutPricing({ ...baseSession, amount_total: 29900 }), false);
  assert.equal(hasExpectedCheckoutPricing({ ...baseSession, currency: "eur" }), false);
  assert.equal(hasExpectedCheckoutPricing({ ...baseSession, mode: "subscription" }), false);
});

test("grantAccessFromCheckoutSession rejects mismatched pricing in strict mode", async () => {
  const result = await grantAccessFromCheckoutSession(
    null,
    {
      id: "ord_fail",
      payment_status: "paid",
      mode: "payment",
      amount_total: 100,
      currency: "usd",
      metadata: {
        expectedAmountCents: "999",
        expectedCurrency: "usd",
      },
    },
    { requireAmountAndCurrencyMatch: true },
  );
  assert.equal(result, null);
});
