import { formatCourseDurationLabel } from "@/lib/courses";
import type { VideoRecord } from "@/lib/videos";
import { getSupabaseAdmin } from "@/server/supabase-registrations";

const BUCKET = "course-videos";
const MAX_BYTES = 2 * 1024 * 1024 * 1024;
const SIGNED_URL_TTL_SECONDS = 60 * 60;

const ALLOWED_TYPES = new Set(["video/mp4", "video/quicktime"]);

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^\w.\-() ]+/g, "_").trim() || "video.mp4";
}

export async function createSignedStorageUrl(
  storagePath: string,
): Promise<{ ok: true; url: string } | { ok: false; reason: string }> {
  const sb = getSupabaseAdmin();
  if (!sb) {
    return { ok: false, reason: "Supabase non configuré" };
  }

  const { data, error } = await sb.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    return { ok: false, reason: error?.message ?? "URL signée introuvable" };
  }

  return { ok: true, url: data.signedUrl };
}

export function formatDurationFromSeconds(seconds: number): string {
  const totalMinutes = Math.max(1, Math.round(seconds / 60));
  return formatCourseDurationLabel(totalMinutes);
}

export type VideoPlaybackSource = {
  kind: "hls" | "mp4";
  url: string;
  posterUrl?: string;
  durationSeconds?: number | null;
  status: string;
};

export async function resolveVideoPlayback(
  video: VideoRecord,
): Promise<{ ok: true; playback: VideoPlaybackSource } | { ok: false; reason: string }> {
  if (video.status === "failed") {
    return { ok: false, reason: video.errorMessage ?? "Traitement vidéo échoué" };
  }

  let posterUrl: string | undefined;
  if (video.posterPath) {
    const poster = await createSignedStorageUrl(video.posterPath);
    if (poster.ok) posterUrl = poster.url;
  }

  if (video.status === "ready" && video.hlsPath) {
    const hls = await createSignedStorageUrl(video.hlsPath);
    if (hls.ok) {
      return {
        ok: true,
        playback: {
          kind: "hls",
          url: hls.url,
          posterUrl,
          durationSeconds: video.durationSeconds,
          status: video.status,
        },
      };
    }
  }

  if (video.storagePath) {
    const mp4 = await createSignedStorageUrl(video.storagePath);
    if (mp4.ok) {
      return {
        ok: true,
        playback: {
          kind: "mp4",
          url: mp4.url,
          posterUrl,
          durationSeconds: video.durationSeconds,
          status: video.status,
        },
      };
    }
    return { ok: false, reason: mp4.reason };
  }

  return { ok: false, reason: "Fichier vidéo introuvable" };
}

export async function uploadSourceVideo(params: {
  videoId: string;
  contentType: string;
  dataBase64: string;
  fileName: string;
}): Promise<{ ok: true; storagePath: string } | { ok: false; reason: string }> {
  const sb = getSupabaseAdmin();
  if (!sb) {
    return { ok: false, reason: "Supabase non configuré (SUPABASE_SERVICE_ROLE_KEY)" };
  }

  const contentType = params.contentType.trim().toLowerCase();
  if (!ALLOWED_TYPES.has(contentType)) {
    return { ok: false, reason: "Format non supporté — MP4 requis" };
  }

  const buffer = Buffer.from(params.dataBase64, "base64");
  if (!buffer.length) {
    return { ok: false, reason: "Fichier vide" };
  }
  if (buffer.length > MAX_BYTES) {
    return { ok: false, reason: "Fichier trop volumineux (max 2 Go)" };
  }

  const safeName = sanitizeFileName(params.fileName);
  const storagePath = `source/${params.videoId}/${safeName}`;

  const { error } = await sb.storage.from(BUCKET).upload(storagePath, buffer, {
    contentType,
    upsert: true,
  });

  if (error) {
    if (error.message.includes("Bucket not found")) {
      return { ok: false, reason: "Bucket course-videos manquant — exécutez supabase/videos_storage.sql" };
    }
    return { ok: false, reason: error.message };
  }

  return { ok: true, storagePath };
}
