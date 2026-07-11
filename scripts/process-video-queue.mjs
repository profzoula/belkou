/**
 * FFmpeg worker — converts queued source MP4s to HLS (1080/720/480) + poster.
 *
 * Usage:
 *   node scripts/process-video-queue.mjs
 *   node scripts/process-video-queue.mjs --dry-run
 *   node scripts/process-video-queue.mjs --video-id <uuid>
 *   node scripts/process-video-queue.mjs --once
 *
 * Requires: ffmpeg + ffprobe on PATH, VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .dev.vars
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join, dirname, relative, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const execFileAsync = promisify(execFile);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const BUCKET = "course-videos";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const once = args.includes("--once");
const videoIdArg = args.find((arg, index) => args[index - 1] === "--video-id");

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

function mimeFor(filePath) {
  const ext = extname(filePath).toLowerCase();
  if (ext === ".m3u8") return "application/vnd.apple.mpegurl";
  if (ext === ".ts") return "video/mp2t";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  return "application/octet-stream";
}

function walkFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(full));
    else files.push(full);
  }
  return files;
}

async function ensureFfmpeg() {
  for (const bin of ["ffmpeg", "ffprobe"]) {
    try {
      await execFileAsync(bin, ["-version"]);
    } catch {
      throw new Error(`${bin} not found — install FFmpeg and add it to PATH`);
    }
  }
}

async function probeDurationSeconds(filePath) {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    filePath,
  ]);
  const seconds = Number.parseFloat(stdout.trim());
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  return Math.round(seconds);
}

async function downloadSource(storagePath, destination) {
  const { data, error } = await sb.storage.from(BUCKET).download(storagePath);
  if (error || !data) {
    throw new Error(error?.message ?? `Download failed: ${storagePath}`);
  }
  const buffer = Buffer.from(await data.arrayBuffer());
  await writeFile(destination, buffer);
}

async function runHlsTranscode(inputPath, outputDir) {
  mkdirSync(join(outputDir, "1080"), { recursive: true });
  mkdirSync(join(outputDir, "720"), { recursive: true });
  mkdirSync(join(outputDir, "480"), { recursive: true });

  await execFileAsync(
    "ffmpeg",
    [
      "-y",
      "-i",
      inputPath,
      "-filter_complex",
      [
        "[0:v]split=3[v1][v2][v3]",
        "[v1]scale=w=1920:h=1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2[v1out]",
        "[v2]scale=w=1280:h=720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2[v2out]",
        "[v3]scale=w=854:h=480:force_original_aspect_ratio=decrease,pad=854:480:(ow-iw)/2:(oh-ih)/2[v3out]",
      ].join("; "),
      "-map",
      "[v1out]",
      "-map",
      "0:a?",
      "-c:v:0",
      "libx264",
      "-preset",
      "fast",
      "-b:v:0",
      "5000k",
      "-maxrate:v:0",
      "5350k",
      "-bufsize:v:0",
      "7500k",
      "-c:a:0",
      "aac",
      "-b:a:0",
      "192k",
      "-map",
      "[v2out]",
      "-map",
      "0:a?",
      "-c:v:1",
      "libx264",
      "-preset",
      "fast",
      "-b:v:1",
      "2800k",
      "-maxrate:v:1",
      "2990k",
      "-bufsize:v:1",
      "4200k",
      "-c:a:1",
      "aac",
      "-b:a:1",
      "128k",
      "-map",
      "[v3out]",
      "-map",
      "0:a?",
      "-c:v:2",
      "libx264",
      "-preset",
      "fast",
      "-b:v:2",
      "1400k",
      "-maxrate:v:2",
      "1490k",
      "-bufsize:v:2",
      "2100k",
      "-c:a:2",
      "aac",
      "-b:a:2",
      "96k",
      "-f",
      "hls",
      "-hls_time",
      "6",
      "-hls_playlist_type",
      "vod",
      "-hls_flags",
      "independent_segments",
      "-master_pl_name",
      "index.m3u8",
      "-var_stream_map",
      "v:0,a:0 v:1,a:1 v:2,a:2",
      "-hls_segment_filename",
      "%v/%03d.ts",
      join(outputDir, "%v", "playlist.m3u8"),
    ],
    { maxBuffer: 20 * 1024 * 1024 },
  );
}

async function generatePoster(inputPath, posterPath) {
  await execFileAsync("ffmpeg", [
    "-y",
    "-ss",
    "5",
    "-i",
    inputPath,
    "-frames:v",
    "1",
    "-q:v",
    "2",
    posterPath,
  ]);
}

async function uploadTree(localDir, remotePrefix) {
  const files = walkFiles(localDir);
  for (const file of files) {
    const rel = relative(localDir, file).replace(/\\/g, "/");
    const storagePath = `${remotePrefix}/${rel}`;
    const body = await readFile(file);
    const { error } = await sb.storage.from(BUCKET).upload(storagePath, body, {
      upsert: true,
      contentType: mimeFor(file),
    });
    if (error) {
      throw new Error(`Upload ${storagePath}: ${error.message}`);
    }
  }
}

async function claimNextVideo() {
  let query = sb
    .from("videos")
    .select("*")
    .eq("status", "queued")
    .not("storage_path", "is", null)
    .order("created_at", { ascending: true })
    .limit(1);

  if (videoIdArg) {
    query = sb.from("videos").select("*").eq("id", videoIdArg).limit(1);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const video = data?.[0];
  if (!video) return null;

  if (!videoIdArg && video.status !== "queued") return null;

  if (dryRun) return video;

  const { data: claimed, error: claimError } = await sb
    .from("videos")
    .update({ status: "processing", error_message: null, updated_at: new Date().toISOString() })
    .eq("id", video.id)
    .eq("status", videoIdArg ? video.status : "queued")
    .select("*")
    .maybeSingle();

  if (claimError) throw new Error(claimError.message);
  return claimed;
}

async function markFailed(videoId, message) {
  if (dryRun) {
    console.error(`[dry-run] would mark ${videoId} failed: ${message}`);
    return;
  }
  await sb
    .from("videos")
    .update({
      status: "failed",
      error_message: message.slice(0, 500),
      updated_at: new Date().toISOString(),
    })
    .eq("id", videoId);
}

async function markReady(videoId, patch) {
  if (dryRun) {
    console.log(`[dry-run] would mark ${videoId} ready`, patch);
    return;
  }
  await sb
    .from("videos")
    .update({
      status: "ready",
      duration_seconds: patch.durationSeconds,
      hls_path: patch.hlsPath,
      poster_path: patch.posterPath,
      preview_path: patch.previewPath,
      error_message: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", videoId);
}

async function processVideo(video) {
  const label = `${video.title} (${video.id})`;
  console.log(`\n▶ Processing ${label}`);

  if (!video.storage_path) {
    throw new Error("storage_path missing");
  }

  const workDir = join(root, ".video-work", video.id);
  const sourcePath = join(workDir, "source.mp4");
  const hlsDir = join(workDir, "hls");
  const posterPath = join(hlsDir, "poster.jpg");
  const remotePrefix = `hls/${video.id}`;

  mkdirSync(workDir, { recursive: true });
  mkdirSync(hlsDir, { recursive: true });

  try {
    if (dryRun) {
      console.log(`  download ${video.storage_path} → ${sourcePath}`);
      console.log(`  ffmpeg HLS → ${hlsDir}`);
      console.log(`  upload → ${remotePrefix}/`);
      await markReady(video.id, {
        durationSeconds: video.duration_seconds ?? 0,
        hlsPath: `${remotePrefix}/index.m3u8`,
        posterPath: `${remotePrefix}/poster.jpg`,
        previewPath: `${remotePrefix}/poster.jpg`,
      });
      return;
    }

    console.log("  downloading source…");
    await downloadSource(video.storage_path, sourcePath);

    console.log("  probing duration…");
    const durationSeconds = (await probeDurationSeconds(sourcePath)) ?? video.duration_seconds;

    console.log("  generating poster…");
    await generatePoster(sourcePath, posterPath);

    console.log("  transcoding HLS (1080/720/480)…");
    await runHlsTranscode(sourcePath, hlsDir);

    const masterPath = join(hlsDir, "index.m3u8");
    if (!existsSync(masterPath)) {
      throw new Error("index.m3u8 not generated");
    }

    console.log("  uploading outputs…");
    await uploadTree(hlsDir, remotePrefix);

    await markReady(video.id, {
      durationSeconds,
      hlsPath: `${remotePrefix}/index.m3u8`,
      posterPath: `${remotePrefix}/poster.jpg`,
      previewPath: `${remotePrefix}/poster.jpg`,
    });

    console.log(`  ✓ ready — ${durationSeconds ?? "?"}s`);
  } finally {
    if (!dryRun && existsSync(workDir)) {
      rmSync(workDir, { recursive: true, force: true });
    }
  }
}

async function main() {
  if (!dryRun) {
    await ensureFfmpeg();
  } else {
    console.log("Dry run — FFmpeg check skipped.");
  }

  do {
    const video = await claimNextVideo();
    if (!video) {
      console.log("No queued videos.");
      break;
    }

    try {
      await processVideo(video);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`  ✗ failed: ${message}`);
      await markFailed(video.id, message);
    }
  } while (!once && !videoIdArg && !dryRun);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
