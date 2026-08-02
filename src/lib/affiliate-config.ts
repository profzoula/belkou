export const AFFILIATE_COMMISSION_USD = 5;
export const AFFILIATE_SIGNUP_COMMISSION_USD = 0.05;
export const AFFILIATE_MIN_WITHDRAWAL_USD = 20;
export const REFERRAL_STORAGE_KEY = "belkou_ref";
export const AFFILIATE_SIGNUP_REFERRAL_PREFIX = "signup:";

/** Max account age to still claim a signup referral (email confirm, deferred claim). */
export const AFFILIATE_SIGNUP_CLAIM_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/** Only brand-new OAuth accounts may bind a cookie referral into referred_by. */
export const AFFILIATE_OAUTH_BIND_MAX_AGE_MS = 15 * 60 * 1000;

/** Format USD for affiliate balances (shows cents below $1). */
export function formatAffiliateUsd(amount: number): string {
  if (amount < 1) return amount.toFixed(2);
  return amount.toFixed(amount % 1 === 0 ? 0 : 2);
}
