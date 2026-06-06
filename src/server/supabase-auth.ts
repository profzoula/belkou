import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

export async function getUserFromAccessToken(accessToken: string): Promise<User | null> {
  const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const sb = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await sb.auth.getUser(accessToken);
  if (error || !data.user) return null;
  return data.user;
}
