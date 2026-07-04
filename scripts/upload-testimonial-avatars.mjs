import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const BUCKET = "testimonial-avatars";

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

/** Pexels portraits — free license (pexels.com/license), Black men & women */
const avatars = [
  { slug: "junior-pierre", photoId: 29387556, name: "Junior Pierre" },
  { slug: "marie-claire-desir", photoId: 11340612, name: "Marie-Claire Désir" },
  { slug: "wislande-joseph", photoId: 3760850, name: "Wislande Joseph" },
  { slug: "mackenson-etienne", photoId: 7623953, name: "Mackenson Étienne" },
  { slug: "sherline-volcy", photoId: 1181690, name: "Sherline Volcy" },
  { slug: "roodly-alce", photoId: 2182970, name: "Roodly Alcé" },
];

function pexelsUrl(photoId) {
  return `https://images.pexels.com/photos/${photoId}/pexels-photo-${photoId}.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop&crop=faces`;
}

const sb = createClient(url, key, { auth: { persistSession: false } });

const { error: bucketError } = await sb.storage.createBucket(BUCKET, {
  public: true,
  fileSizeLimit: 5 * 1024 * 1024,
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
});

if (bucketError && !bucketError.message.toLowerCase().includes("already exists")) {
  console.warn("Bucket create:", bucketError.message);
  console.warn("If upload fails, run supabase/testimonial_avatars_storage.sql in SQL Editor.");
}

const results = [];

for (const item of avatars) {
  const sourceUrl = pexelsUrl(item.photoId);
  console.log(`Downloading ${item.name}...`);

  const response = await fetch(sourceUrl, {
    headers: { "User-Agent": "BelKou-avatar-upload/1.0" },
  });

  if (!response.ok) {
    console.error(`  Failed download (${response.status}): ${item.slug}`);
    continue;
  }

  const contentType = response.headers.get("content-type") ?? "image/jpeg";
  const ext = contentType.includes("webp") ? "webp" : contentType.includes("png") ? "png" : "jpg";
  const buffer = Buffer.from(await response.arrayBuffer());
  const path = `${item.slug}.${ext}`;

  const { error: uploadError } = await sb.storage.from(BUCKET).upload(path, buffer, {
    contentType,
    upsert: true,
  });

  if (uploadError) {
    console.error(`  Upload failed for ${item.slug}:`, uploadError.message);
    continue;
  }

  const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
  console.log(`  OK → ${data.publicUrl}`);
  results.push({ slug: item.slug, name: item.name, url: data.publicUrl });
}

console.log("\n--- URLs for Testimonials.tsx ---\n");
for (const row of results) {
  console.log(`${row.name}: ${row.url}`);
}

if (results.length !== avatars.length) {
  process.exit(1);
}
