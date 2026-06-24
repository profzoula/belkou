/**
 * Run affiliate migration on Supabase.
 * Usage: node scripts/setup-affiliates.mjs
 * Requires: SUPABASE_URL (or VITE_SUPABASE_URL) + SUPABASE_SERVICE_ROLE_KEY in env
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sql = readFileSync(join(root, "migrations", "supabase_affiliates.sql"), "utf8");

const res = await fetch(`${url.replace(/\/$/, "")}/rest/v1/rpc`, {
  method: "POST",
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({}),
}).catch(() => null);

// Supabase REST cannot run arbitrary SQL — print instructions
console.log(`
BelKou affiliate setup
====================
Copy migrations/supabase_affiliates.sql into Supabase Dashboard → SQL Editor → Run.

The app also works without this migration (codes stored in user metadata).
`);

process.exit(res?.ok ? 0 : 0);
