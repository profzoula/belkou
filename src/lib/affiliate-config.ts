export const AFFILIATE_COMMISSION_USD = 5;
export const AFFILIATE_SIGNUP_COMMISSION_USD = 0.05;
export const AFFILIATE_MIN_WITHDRAWAL_USD = 20;
export const REFERRAL_STORAGE_KEY = "belkou_ref";
export const AFFILIATE_SIGNUP_REFERRAL_PREFIX = "signup:";

/** Format USD for affiliate balances (shows cents below $1). */
export function formatAffiliateUsd(amount: number): string {
  if (amount < 1) return amount.toFixed(2);
  return amount.toFixed(amount % 1 === 0 ? 0 : 2);
}
