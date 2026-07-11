import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

let browserClient: SupabaseClient | null = null;

/** Browser-only Supabase client — stores PKCE verifier in cookies (required for OAuth + SSR). */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured || typeof window === "undefined") return null;
  browserClient ??= createBrowserClient(url!, anonKey!, {
    cookieOptions: {
      secure: window.location.protocol === "https:",
      sameSite: "lax",
      path: "/",
    },
    auth: {
      detectSessionInUrl: false,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  return browserClient;
}

/** @deprecated Prefer getSupabase() — null during SSR. */
export const supabase = typeof window !== "undefined" ? getSupabase() : null;
