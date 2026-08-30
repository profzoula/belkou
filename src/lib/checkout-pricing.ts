/**
 * Pricing integrity guard for hosted checkout (Square Payment Links).
 * Dependency-free so the critical-test runner can execute it directly.
 */
export type CheckoutPricingLike = {
  mode?: string | null;
  amount_total?: number | null;
  currency?: string | null;
  total_details?: { amount_discount?: number | null } | null;
  metadata?: Record<string, string> | null;
};

export function hasExpectedCheckoutPricing(session: CheckoutPricingLike): boolean {
  const expectedAmountRaw = session.metadata?.expectedAmountCents?.trim();
  const expectedCurrency = session.metadata?.expectedCurrency?.trim()?.toLowerCase();

  if (!expectedAmountRaw && !expectedCurrency) return true;
  if (session.mode && session.mode !== "payment") return false;

  if (expectedCurrency) {
    const actualCurrency = session.currency?.toLowerCase();
    if (!actualCurrency || actualCurrency !== expectedCurrency) return false;
  }

  if (expectedAmountRaw) {
    const expectedAmount = Number.parseInt(expectedAmountRaw, 10);
    if (!Number.isFinite(expectedAmount)) return false;
    if (typeof session.amount_total !== "number") return false;
    // A provider-reported discount is the only reason we accept less than the quoted price.
    const discount = session.total_details?.amount_discount ?? 0;
    if (!Number.isFinite(discount) || discount < 0) return false;
    if (session.amount_total + discount !== expectedAmount) return false;
  }

  return true;
}

/** @deprecated Use hasExpectedCheckoutPricing */
export const hasExpectedStripePricingForSession = hasExpectedCheckoutPricing;
