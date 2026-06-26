import { getSupabaseAdmin } from "@/server/supabase-registrations";

export type LessonProgressRow = {
  lesson_id: string;
  completed_at: string;
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
    .select("lesson_id, completed_at")
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
    completed_at: String(row.completed_at),
  }));
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
