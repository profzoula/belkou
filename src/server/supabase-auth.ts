import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import { getSupabasePublicEnv } from "@/server/supabase-user-client";

export async function getUserFromAccessToken(accessToken: string): Promise<User | null> {
  const { url, anonKey } = getSupabasePublicEnv();
  if (!url || !anonKey) {
    console.error("[BelKou] getUserFromAccessToken: Supabase URL or anon key missing on server");
    return null;
  }

  const sb = createClient(url, anonKey, { auth: { persistSession: false } });
  const { data, error } = await sb.auth.getUser(accessToken);
  if (error || !data.user) {
    if (error) console.error("[BelKou] getUserFromAccessToken:", error.message);
    return null;
  }
  return data.user;
}
