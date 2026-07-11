import { normalizeRegistrationEmail } from "@/lib/schemas/registration";
import { getSupabaseAdmin } from "@/server/supabase-registrations";

export type LessonProgressRow = {
  lesson_id: string;
  completed_at: string | null;
  current_time_seconds: number;
};

export async function listLessonProgress(
  email: string,
  courseSlug: string,
): Promise<LessonProgressRow[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];

  const normalized = normalizeRegistrationEmail(email);
  const { data, error } = await sb
    .from("lesson_progress")
    .select("lesson_id, completed_at, current_time_seconds")
    .ilike("email", normalized)
    .eq("course_slug", courseSlug);

  if (error) {
    if (!error.message.includes("lesson_progress")) {
      console.error("[BelKou] list lesson progress:", error.message);
    }
    return [];
  }

  return (data ?? []).map((row) => ({
    lesson_id: String(row.lesson_id),
    completed_at: row.completed_at ? String(row.completed_at) : null,
    current_time_seconds: Number(row.current_time_seconds) || 0,
  }));
}

export async function saveLessonPlaybackPosition(
  email: string,
  courseSlug: string,
  lessonId: string,
  currentTimeSeconds: number,
): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return;

  const normalized = normalizeRegistrationEmail(email);
  const seconds = Math.max(0, Math.floor(currentTimeSeconds));
  const now = new Date().toISOString();

  const { data: existing, error: readError } = await sb
    .from("lesson_progress")
    .select("id")
    .ilike("email", normalized)
    .eq("course_slug", courseSlug)
    .eq("lesson_id", lessonId)
    .maybeSingle();

  if (readError && !readError.message.includes("lesson_progress")) {
    console.error("[BelKou] read lesson playback:", readError.message);
    return;
  }

  if (existing) {
    const { error } = await sb
      .from("lesson_progress")
      .update({ current_time_seconds: seconds, last_watched_at: now })
      .eq("id", existing.id);
    if (error && !error.message.includes("lesson_progress")) {
      console.error("[BelKou] update lesson playback:", error.message);
    }
    return;
  }

  const { error } = await sb.from("lesson_progress").insert({
    email: normalized,
    course_slug: courseSlug,
    lesson_id: lessonId,
    current_time_seconds: seconds,
    last_watched_at: now,
    completed_at: null,
  });

  if (error && !error.message.includes("lesson_progress")) {
    console.error("[BelKou] insert lesson playback:", error.message);
  }
}

export async function markLessonComplete(
  email: string,
  courseSlug: string,
  lessonId: string,
): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return;

  const normalized = normalizeRegistrationEmail(email);
  const { error } = await sb.from("lesson_progress").upsert(
    {
      email: normalized,
      course_slug: courseSlug,
      lesson_id: lessonId,
      completed_at: new Date().toISOString(),
    },
    { onConflict: "email,course_slug,lesson_id" },
  );

  if (error && !error.message.includes("lesson_progress")) {
    console.error("[BelKou] mark lesson complete:", error.message);
  }
}

export function computeProgressPercent(completed: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((completed / total) * 100));
}

export async function listDistinctCourseSlugsForEmail(email: string): Promise<string[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];

  const normalized = normalizeRegistrationEmail(email);
  const { data, error } = await sb
    .from("lesson_progress")
    .select("course_slug")
    .ilike("email", normalized);

  if (error) {
    if (!error.message.includes("lesson_progress")) {
      console.error("[BelKou] list progress course slugs:", error.message);
    }
    return [];
  }

  return [...new Set((data ?? []).map((row) => String(row.course_slug)).filter(Boolean))];
}
