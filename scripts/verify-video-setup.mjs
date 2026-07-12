/**
 * Verify Supabase video infrastructure (table + bucket).
 *
 * Usage: node scripts/verify-video-setup.mjs
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

async function main() {
  let ok = true;

  const { error: videosError, count } = await sb
    .from("videos")
    .select("id", { count: "exact", head: true });

  if (videosError) {
    console.error("✗ Table videos:", videosError.message);
    console.error("  → Run migrations/supabase_videos.sql in Supabase SQL Editor");
    ok = false;
  } else {
    console.log(`✓ Table videos (${count ?? 0} row(s))`);
  }

  const { data: buckets, error: bucketError } = await sb.storage.listBuckets();
  if (bucketError) {
    console.error("✗ Storage buckets:", bucketError.message);
    ok = false;
  } else {
    const bucket = buckets?.find((item) => item.id === "course-videos");
    if (!bucket) {
      console.error("✗ Bucket course-videos missing");
      console.error("  → Run supabase/videos_storage.sql in Supabase SQL Editor");
      ok = false;
    } else {
      console.log(`✓ Bucket course-videos (public=${bucket.public})`);
      const limitMb = bucket.file_size_limit
        ? Math.round(bucket.file_size_limit / 1024 / 1024)
        : null;
      if (limitMb) {
        console.log(`  Bucket file_size_limit: ${limitMb} MB`);
      }
      console.warn("⚠ Supabase Free plan: global max 50 MB per file (Storage → Settings)");
      const mimes = bucket.allowed_mime_types ?? [];
      const needed = ["video/mp4", "video/mp2t", "application/vnd.apple.mpegurl", "image/jpeg"];
      const missing = needed.filter((mime) => !mimes.includes(mime));
      if (missing.length) {
        console.warn(`⚠ Bucket mime types missing: ${missing.join(", ")}`);
        console.warn("  → Re-run supabase/videos_storage.sql");
      } else {
        console.log("✓ Bucket mime types (MP4 + HLS + poster)");
      }
    }
  }

  const { error: progressError } = await sb
    .from("lesson_progress")
    .select("current_time_seconds")
    .limit(1);

  if (progressError) {
    if (progressError.message.includes("current_time_seconds")) {
      console.error("✗ lesson_progress.current_time_seconds missing");
      console.error("  → Run migrations/supabase_videos.sql");
      ok = false;
    } else {
      console.error("✗ lesson_progress:", progressError.message);
      ok = false;
    }
  } else {
    console.log("✓ lesson_progress playback columns");
  }

  if (!ok) process.exit(1);
  console.log("\nVideo setup OK — upload in Admin → Vidéos");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
