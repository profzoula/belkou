import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const email = (process.argv[2] ?? "mckensong@gmail.com").trim().toLowerCase();

function loadDevVars() {
  for (const file of [".dev.vars", ".env"]) {
    const path = join(root, file);
    if (!existsSync(path)) continue;
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
}

loadDevVars();

const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .dev.vars or .env");
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });

const { data, error: findError } = await sb
  .from("registrations")
  .select("*")
  .ilike("email", email)
  .order("created_at", { ascending: false })
  .limit(1)
  .maybeSingle();

if (findError || !data) {
  console.error("Registration not found for", email, findError?.message ?? "");
  process.exit(1);
}

const { error: updateError } = await sb
  .from("registrations")
  .update({ plan: "vip", payment_status: "paid" })
  .eq("id", data.id);

if (updateError) {
  console.error("Update failed:", updateError.message);
  process.exit(1);
}

console.log("OK — VIP gratuit activé:");
console.log("  Nom:", data.full_name);
console.log("  Email:", data.email);
console.log("  Plan: vip");
console.log("  Paiement: paid");
