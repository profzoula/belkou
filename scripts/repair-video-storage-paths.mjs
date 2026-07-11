/**
 * Repair videos missing storage_path by matching files in course-videos bucket.
 *
 * Usage: node scripts/repair-video-storage-paths.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const BUCKET = "course-videos";

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

async function listSourceFiles(videoId) {
  const prefix = `source/${videoId}`;
  const { data, error } = await sb.storage.from(BUCKET).list(`source/${videoId}`);
  if (error) {
    throw new Error(error.message);
  }
  const files = (data ?? []).filter((item) => item.name && !item.name.endsWith("/"));
  return files.map((item) => `${prefix}/${item.name}`);
}

const { data: videos, error } = await sb.from("videos").select("*").order("created_at", { ascending: true });
if (error) {
  console.error(error.message);
  process.exit(1);
}

let repaired = 0;

for (const video of videos ?? []) {
  const currentPath = (video.storage_path ?? "").trim();
  if (currentPath) continue;

  console.log(`\nRepairing: ${video.title} (${video.id})`);

  try {
    const candidates = await listSourceFiles(video.id);
    if (!candidates.length) {
      console.warn("  ✗ no source file in bucket — re-upload required");
      await sb
        .from("videos")
        .update({
          status: "failed",
          error_message: "Fichier source introuvable — ré-uploadez la vidéo",
          updated_at: new Date().toISOString(),
        })
        .eq("id", video.id);
      continue;
    }

    const preferred =
      candidates.find((path) => path.toLowerCase().includes(video.filename?.toLowerCase() ?? "")) ??
      candidates[0];

    await sb
      .from("videos")
      .update({
        storage_path: preferred,
        status: video.hls_path ? "ready" : "ready",
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", video.id);

    console.log(`  ✓ storage_path → ${preferred}`);
    repaired += 1;
  } catch (err) {
    console.error(`  ✗ ${err instanceof Error ? err.message : String(err)}`);
  }
}

console.log(`\nDone — repaired ${repaired} video(s). Worker will convert missing HLS on next poll.`);
