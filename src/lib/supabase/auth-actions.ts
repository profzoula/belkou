import { REFERRAL_STORAGE_KEY } from "@/lib/affiliate-config";
import { siteConfig } from "@/lib/site-config";
import { getSupabase } from "@/lib/supabase/client";

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
