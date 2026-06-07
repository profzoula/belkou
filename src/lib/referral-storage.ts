import { REFERRAL_STORAGE_KEY } from "@/lib/affiliate-config";

export function normalizeReferralCode(code: string): string {
  return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function saveReferralCode(code: string) {
  if (typeof window === "undefined") return;
  const normalized = normalizeReferralCode(code);
  if (!normalized) return;
  localStorage.setItem(REFERRAL_STORAGE_KEY, normalized);
}

export function getStoredReferralCode(): string | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(REFERRAL_STORAGE_KEY);
  return stored ? normalizeReferralCode(stored) : null;
}

export function clearStoredReferralCode() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(REFERRAL_STORAGE_KEY);
}
