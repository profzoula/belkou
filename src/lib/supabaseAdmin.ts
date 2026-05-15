import { createClient } from "@supabase/supabase-js";
import ws from "ws";

export function getSupabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL ?? "https://jxubkuskszpzsllkbmzv.supabase.co";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY manke");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { transport: ws } as never,
  });
}
