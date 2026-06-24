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

const url = process.env.VITE_SUPABASE_URL ?? "https://jxubkuskszpzsllkbmzv.supabase.co";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const testEmail = process.argv[2] ?? "ukklaistore@gmail.com";

if (!key) {
  console.error("SUPABASE_SERVICE_ROLE_KEY missing");
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });

console.log("URL:", url);
console.log("Test email:", testEmail);

const { data: existing, error: findErr } = await sb
  .from("registrations")
  .select("*")
  .ilike("email", testEmail.trim().toLowerCase())
  .limit(3);

console.log("\n--- Find by email ---");
console.log("error:", findErr?.message ?? "none");
console.log("rows:", existing?.length ?? 0);
if (existing?.[0]) console.log("first row:", JSON.stringify(existing[0], null, 2));

const testId = crypto.randomUUID();
const payload = {
  id: testId,
  full_name: "Test Diagnostic",
  email: testEmail.trim().toLowerCase(),
  whatsapp: "9413010414",
  country: "US",
  level: "advanced",
  plan: "premium",
  payment_status: "pending",
  stripe_session_id: null,
  created_at: new Date().toISOString(),
};

console.log("\n--- Insert test ---");
const { error: insertErr } = await sb.from("registrations").insert(payload);
console.log("insert error:", insertErr?.message ?? "none", insertErr?.details ?? "", insertErr?.hint ?? "");

if (!insertErr) {
  await sb.from("registrations").delete().eq("id", testId);
  console.log("cleaned up test row");
}

console.log("\n--- Insert without created_at ---");
const testId2 = crypto.randomUUID();
const { error: insert2Err } = await sb.from("registrations").insert({
  ...payload,
  id: testId2,
  email: `diag-${Date.now()}@test.local`,
});
console.log("insert2 error:", insert2Err?.message ?? "none");
if (!insert2Err) {
  await sb.from("registrations").delete().eq("id", testId2);
}

const { data: columns } = await sb.rpc("noop").catch(() => ({ data: null }));
void columns;
