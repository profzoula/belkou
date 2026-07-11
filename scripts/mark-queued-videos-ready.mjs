/**
 * Mark uploaded videos as ready for MP4 playback (clears stale "queued" status).
 *
 * Usage: node scripts/mark-queued-videos-ready.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadDevVars() {
  const path = join(root, ".dev.vars");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

loadDevVars();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required in .dev.vars");
  process.exit(1);
}

const sb = createClient(url, key);

const { data, error } = await sb
  .from("videos")
  .update({ status: "ready", updated_at: new Date().toISOString() })
  .eq("status", "queued")
  .not("storage_path", "is", null)
  .select("id, title");

if (error) {
  console.error(error.message);
  process.exit(1);
}

console.log(`Updated ${data?.length ?? 0} video(s) to ready (MP4 playback):`);
for (const row of data ?? []) {
  console.log(`  ✓ ${row.title} (${row.id})`);
}
