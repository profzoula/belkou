import type { EmailOtpType } from "@supabase/supabase-js";
import { REFERRAL_STORAGE_KEY } from "@/lib/affiliate-config";
import { siteConfig } from "@/lib/site-config";
import { getSupabase } from "@/lib/supabase/client";

const OTP_TYPES = new Set<EmailOtpType>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

/**
 * Supabase → Authentication → Email Templates → Confirm signup:
 * use {{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup
 * so confirmation works from any device (Gmail app, phone, etc.).
 */
export async function finishAuthCallback(search: URLSearchParams): Promise<{
  error: string | null;
  accessToken: string | null;
}> {
  const supabase = getSupabase();
  if (!supabase) {
    return { error: "Authentification non configurée.", accessToken: null };
  }

  const tokenHash = search.get("token_hash");
  const otpType = search.get("type");
  const code = search.get("code");

  if (tokenHash && otpType && OTP_TYPES.has(otpType as EmailOtpType)) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: otpType as EmailOtpType,
    });
    if (error) return { error: error.message, accessToken: null };
    return { error: null, accessToken: data.session?.access_token ?? null };
  }

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return { error: error.message, accessToken: null };
    return { error: null, accessToken: data.session?.access_token ?? null };
  }

  return { error: "Lien de confirmation invalide ou expiré.", accessToken: null };
}

/** OAuth return URL — must match Supabase → Authentication → URL Configuration. */
export function getAuthCallbackUrl(): string {
  const siteUrl = siteConfig.siteUrl.replace(/\/$/, "");

  if (typeof window === "undefined") {
    return `${siteUrl}/auth/callback`;
  }

  const { hostname, origin } = window.location;
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1";

  if (isLocal) {
    return `${origin.replace(/\/$/, "")}/auth/callback`;
  }

  return `${siteUrl}/auth/callback`;
}

function persistReferralCookieForOAuth() {
  if (typeof document === "undefined") return;
  const ref = localStorage.getItem(REFERRAL_STORAGE_KEY);
  if (!ref) return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${REFERRAL_STORAGE_KEY}=${encodeURIComponent(ref)}; path=/; max-age=86400; SameSite=Lax${secure}`;
}

export async function signInWithGoogle() {
  const supabase = getSupabase();
  if (!supabase) {
    return { error: new Error("Authentification non configurée.") };
  }

  persistReferralCookieForOAuth();

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: getAuthCallbackUrl(),
      queryParams: {
        access_type: "offline",
        prompt: "select_account",
      },
    },
  });

  return { error: error ?? null };
}

/** Resend signup confirmation email (Supabase Auth + your SMTP). */
export async function resendSignupConfirmation(email: string) {
  const supabase = getSupabase();
  if (!supabase) {
    return { error: new Error("Authentification non configurée.") };
  }

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: getAuthCallbackUrl(),
    },
  });

  return { error: error ?? null };
}
