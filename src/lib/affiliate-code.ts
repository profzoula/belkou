import { normalizeRegistrationEmail } from "@/lib/schemas/registration";

export function normalizeAffiliateCode(code: string): string {
  return code
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

/** Single canonical affiliate code: email prefix + user id fragment (stable per user). */
export function deriveAffiliateCode(userId: string, email: string): string {
  const base =
    email
      .split("@")[0]
      .replace(/[^a-z0-9]/gi, "")
      .slice(0, 4)
      .toUpperCase() || "BK";
  const uid = userId.replace(/-/g, "").toUpperCase();
  return `${base}${uid.slice(0, 4)}`;
}

export function affiliateCodeForUser(user: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}): string {
  const meta = user.user_metadata?.affiliate_code;
  if (typeof meta === "string" && meta.trim()) {
    return normalizeAffiliateCode(meta);
  }
  if (!user.email) return deriveAffiliateCode(user.id, "user@belkou.fr");
  return deriveAffiliateCode(user.id, normalizeRegistrationEmail(user.email));
}
