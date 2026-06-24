import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const devVars = join(root, ".dev.vars");
if (existsSync(devVars)) {
  for (const line of readFileSync(devVars, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim();
    if (k && process.env[k] === undefined) process.env[k] = v;
  }
}

const url = process.env.VITE_SUPABASE_URL ?? "https://jxubkuskszpzsllkbmzv.supabase.co";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sb = createClient(url, key, { auth: { persistSession: false } });

const { data, error } = await sb.from("registrations").select("*").limit(2);
console.log("sample error:", error?.message ?? "none");
console.log("sample rows:", JSON.stringify(data, null, 2));
