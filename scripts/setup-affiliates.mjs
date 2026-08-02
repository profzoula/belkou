/**
 * Verify affiliate tables exist on Supabase (REST cannot run arbitrary SQL).
 * Usage: node scripts/setup-affiliates.mjs
 * Requires: SUPABASE_URL (or VITE_SUPABASE_URL) + SUPABASE_SERVICE_ROLE_KEY
 */
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const url = (process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL)?.replace(/\/$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const migrationPath = join(root, "migrations", "supabase_affiliates.sql");
if (!existsSync(migrationPath)) {
  console.error(`Missing migration file: ${migrationPath}`);
  process.exit(1);
}

async function tableExists(name) {
  const res = await fetch(`${url}/rest/v1/${name}?select=id&limit=1`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });
  if (res.ok) return true;
  const text = await res.text();
  if (/does not exist|schema cache|Could not find the table/i.test(text)) return false;
  // Other errors (RLS, etc.) still mean the table is present.
  return res.status !== 404;
}

const affiliatesOk = await tableExists("affiliates");
const referralsOk = await tableExists("affiliate_referrals");
const withdrawalsOk = await tableExists("affiliate_withdrawals");

console.log("BelKou affiliate setup check");
console.log("===========================");
console.log(`affiliates:           ${affiliatesOk ? "OK" : "MISSING"}`);
console.log(`affiliate_referrals:  ${referralsOk ? "OK" : "MISSING"}`);
console.log(`affiliate_withdrawals:${withdrawalsOk ? "OK" : "MISSING"}`);

if (affiliatesOk && referralsOk && withdrawalsOk) {
  console.log("\nAffiliate tables are ready.");
  process.exit(0);
}

const sql = readFileSync(migrationPath, "utf8");
console.error(`
Affiliate tables are NOT ready.
Supabase REST cannot execute SQL — run the migration manually:

1. Open Supabase Dashboard → SQL Editor
2. Paste and run: migrations/supabase_affiliates.sql
3. (Optional) migrations/supabase_affiliates_rls_read.sql
4. Re-run: node scripts/setup-affiliates.mjs

SQL file length: ${sql.length} chars
`);
process.exit(1);
