import type { VideoRecord, VideoStatus } from "@/lib/videos";
import { getSupabaseAdmin } from "@/server/supabase-registrations";

type VideoRow = {
  id: string;
  title: string;
  filename: string;
  original_size: number | null;
  duration_seconds: number | null;
  status: VideoStatus;
  storage_path: string | null;
  hls_path: string | null;
  poster_path: string | null;
  preview_path: string | null;
  error_message: string | null;
  course_slug: string | null;
  lesson_id: string | null;
  created_at: string;
  updated_at: string;
};

function isMissingTable(message: string): boolean {
  return (
    message.includes("does not exist") ||
    message.includes("Could not find the table") ||
    message.includes("schema cache")
  );
}

function mapVideoRow(row: VideoRow): VideoRecord {
  return {
    id: row.id,
    title: row.title,
    filename: row.filename,
    originalSize: row.original_size,
    durationSeconds: row.duration_seconds,
    status: row.status,
    storagePath: row.storage_path,
    hlsPath: row.hls_path,
    posterPath: row.poster_path,
    previewPath: row.preview_path,
    errorMessage: row.error_message,
    courseSlug: row.course_slug,
    lessonId: row.lesson_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createVideoRecord(params: {
  title: string;
  filename: string;
  originalSize: number;
  storagePath: string;
  courseSlug?: string;
  lessonId?: string;
}): Promise<{ ok: true; video: VideoRecord } | { ok: false; reason: string }> {
  const sb = getSupabaseAdmin();
  if (!sb) {
    return { ok: false, reason: "Supabase non configuré (SUPABASE_SERVICE_ROLE_KEY)" };
  }

  const { data, error } = await sb
    .from("videos")
    .insert({
      title: params.title.trim(),
      filename: params.filename.trim(),
      original_size: params.originalSize,
      storage_path: params.storagePath,
      course_slug: params.courseSlug?.trim() || null,
      lesson_id: params.lessonId?.trim() || null,
      status: "queued",
    })
    .select("*")
    .single();

  if (error) {
    if (isMissingTable(error.message)) {
      return { ok: false, reason: "Table videos manquante — exécutez migrations/supabase_videos.sql" };
    }
    return { ok: false, reason: error.message };
  }

  return { ok: true, video: mapVideoRow(data as VideoRow) };
}

export async function listVideoRecords(): Promise<VideoRecord[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];

  const { data, error } = await sb
    .from("videos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    if (!isMissingTable(error.message)) {
      console.error("[BelKou] list videos:", error.message);
    }
    return [];
  }

  return (data ?? []).map((row) => mapVideoRow(row as VideoRow));
}

export async function getVideoRecord(id: string): Promise<VideoRecord | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;

  const { data, error } = await sb.from("videos").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return mapVideoRow(data as VideoRow);
}

export async function updateVideoRecord(
  id: string,
  patch: Partial<{
    status: VideoStatus;
    durationSeconds: number;
    storagePath: string;
    hlsPath: string;
    posterPath: string;
    previewPath: string;
    errorMessage: string | null;
  }>,
): Promise<boolean> {
  const sb = getSupabaseAdmin();
  if (!sb) return false;

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.durationSeconds !== undefined) update.duration_seconds = patch.durationSeconds;
  if (patch.storagePath !== undefined) update.storage_path = patch.storagePath;
  if (patch.hlsPath !== undefined) update.hls_path = patch.hlsPath;
  if (patch.posterPath !== undefined) update.poster_path = patch.posterPath;
  if (patch.previewPath !== undefined) update.preview_path = patch.previewPath;
  if (patch.errorMessage !== undefined) update.error_message = patch.errorMessage;

  const { error } = await sb.from("videos").update(update).eq("id", id);
  if (error) {
    console.error("[BelKou] update video:", error.message);
    return false;
  }
  return true;
}

export async function deleteVideoRecord(id: string): Promise<{ ok: true } | { ok: false; reason: string }> {
  const sb = getSupabaseAdmin();
  if (!sb) {
    return { ok: false, reason: "Supabase non configuré (SUPABASE_SERVICE_ROLE_KEY)" };
  }

  const { error } = await sb.from("videos").delete().eq("id", id);
  if (error) {
    if (isMissingTable(error.message)) {
      return { ok: false, reason: "Table videos manquante" };
    }
    return { ok: false, reason: error.message };
  }

  return { ok: true };
}
