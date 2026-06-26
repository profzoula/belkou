import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function getSupabasePublicEnv() {
  const url =
    process.env.VITE_SUPABASE_URL ??
    process.env.SUPABASE_URL ??
    (typeof import.meta !== "undefined" ? import.meta.env?.VITE_SUPABASE_URL : undefined);
  const anonKey =
    process.env.VITE_SUPABASE_ANON_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    (typeof import.meta !== "undefined" ? import.meta.env?.VITE_SUPABASE_ANON_KEY : undefined);
  return { url, anonKey };
}

/** Supabase client scoped to the logged-in user (RLS applies). */
export function getSupabaseAsUser(accessToken: string): SupabaseClient | null {
  const { url, anonKey } = getSupabasePublicEnv();
  if (!url || !anonKey || !accessToken) return null;

  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}
