import { siteConfig } from "@/lib/site-config";
import { supabase } from "@/lib/supabase/client";

export function getAuthCallbackUrl(): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/auth/callback`;
  }
  return `${siteConfig.siteUrl}/auth/callback`;
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
