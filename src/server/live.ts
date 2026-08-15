import { registrationCourseKey } from "@/lib/course-access";
import type { LiveComment, LiveProvider, LiveSession, LiveStatus } from "@/lib/live";
import { getSupabaseAdmin } from "@/server/supabase-registrations";

function isMissingTable(message: string): boolean {
  return (
    message.includes("does not exist") ||
    message.includes("Could not find the table") ||
    message.includes("schema cache")
  );
}

function mapSession(
  row: Record<string, unknown>,
  courseTitle = "",
): LiveSession {
  return {
    id: String(row.id),
    courseSlug: String(row.course_slug),
    courseTitle,
    title: String(row.title),
    description: typeof row.description === "string" ? row.description : "",
    status: (row.status as LiveStatus) ?? "scheduled",
    provider: (row.provider as LiveProvider) ?? "youtube",
    playbackUrl: String(row.playback_url ?? ""),
    scheduledAt: String(row.scheduled_at),
    startedAt: row.started_at ? String(row.started_at) : null,
    endedAt: row.ended_at ? String(row.ended_at) : null,
    recordingUrl: row.recording_url ? String(row.recording_url) : null,
    recordingLessonId: row.recording_lesson_id ? String(row.recording_lesson_id) : null,
    createdAt: String(row.created_at),
  };
}

function mapComment(row: Record<string, unknown>): LiveComment {
  return {
    id: String(row.id),
    sessionId: String(row.session_id),
    authorUserId: String(row.author_user_id),
    authorName: String(row.author_name),
    body: String(row.body),
    createdAt: String(row.created_at),
  };
}

export async function listLiveSessions(): Promise<LiveSession[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];

  const { data, error } = await sb
    .from("live_sessions")
    .select("*")
    .order("scheduled_at", { ascending: false });

  if (error) {
    if (!isMissingTable(error.message)) {
      console.error("[BelKou] list live sessions:", error.message);
    }
    return [];
  }

  return (data ?? []).map((row) => mapSession(row));
}

export async function getLiveSession(id: string): Promise<LiveSession | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;

  const { data, error } = await sb.from("live_sessions").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return mapSession(data);
}

export async function createLiveSession(input: {
  courseSlug: string;
  title: string;
  description?: string;
  provider: LiveProvider;
  playbackUrl: string;
  scheduledAt: string;
}): Promise<LiveSession> {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error("Live indisponible — configurez Supabase.");

  const { data, error } = await sb
    .from("live_sessions")
    .insert({
      course_slug: registrationCourseKey(input.courseSlug),
      title: input.title.trim(),
      description: input.description?.trim() || null,
      provider: input.provider,
      playback_url: input.playbackUrl.trim(),
      scheduled_at: input.scheduledAt,
      status: "scheduled",
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Impossible de créer le live.");
  }

  return mapSession(data);
}

export async function updateLiveSession(
  id: string,
  patch: Partial<{
    title: string;
    description: string | null;
    status: LiveStatus;
    provider: LiveProvider;
    playbackUrl: string;
    scheduledAt: string;
    startedAt: string | null;
    endedAt: string | null;
    recordingUrl: string | null;
    recordingLessonId: string | null;
  }>,
): Promise<LiveSession> {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error("Live indisponible — configurez Supabase.");

  const row: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (patch.title !== undefined) row.title = patch.title.trim();
  if (patch.description !== undefined) row.description = patch.description;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.provider !== undefined) row.provider = patch.provider;
  if (patch.playbackUrl !== undefined) row.playback_url = patch.playbackUrl.trim();
  if (patch.scheduledAt !== undefined) row.scheduled_at = patch.scheduledAt;
  if (patch.startedAt !== undefined) row.started_at = patch.startedAt;
  if (patch.endedAt !== undefined) row.ended_at = patch.endedAt;
  if (patch.recordingUrl !== undefined) row.recording_url = patch.recordingUrl;
  if (patch.recordingLessonId !== undefined) row.recording_lesson_id = patch.recordingLessonId;

  const { data, error } = await sb.from("live_sessions").update(row).eq("id", id).select("*").single();
  if (error || !data) {
    throw new Error(error?.message ?? "Mise à jour impossible.");
  }
  return mapSession(data);
}

export async function listLiveComments(sessionId: string): Promise<LiveComment[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];

  const { data, error } = await sb
    .from("live_comments")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
    .limit(400);

  if (error) {
    if (!isMissingTable(error.message)) {
      console.error("[BelKou] list live comments:", error.message);
    }
    return [];
  }

  return (data ?? []).map((row) => mapComment(row));
}

export async function createLiveComment(input: {
  sessionId: string;
  authorUserId: string;
  authorEmail: string;
  authorName: string;
  body: string;
}): Promise<LiveComment> {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error("Commentaires indisponibles.");

  const { data, error } = await sb
    .from("live_comments")
    .insert({
      session_id: input.sessionId,
      author_user_id: input.authorUserId,
      author_email: input.authorEmail,
      author_name: input.authorName,
      body: input.body.trim(),
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Impossible d'envoyer le commentaire.");
  }

  return mapComment(data);
}
