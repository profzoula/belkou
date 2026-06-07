import { siteConfig } from "@/lib/site-config";
import { supabase } from "@/lib/supabase/client";

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

  // Production: always use configured site URL (avoids localhost fallback from Supabase)
  return `${siteUrl}/auth/callback`;
}

export async function signInWithGoogle() {
  if (!supabase) {
    return { error: new Error("Authentification non configurée.") };
  }

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
