import type { Course } from "@/lib/courses";
import {
  getAllLessons,
  getCourseDisplayDuration,
  getLessonVideoId,
} from "@/lib/courses";
import { getSupabaseAdmin } from "@/server/supabase-registrations";

function secondsToLessonDuration(seconds: number): string {
  const totalMinutes = Math.max(1, Math.round(seconds / 60));
  const hours = Math.floor(totalMinutes / 60);
  const rest = totalMinutes % 60;
  if (hours > 0 && rest > 0) return `${hours}h ${rest}min`;
  if (hours > 0) return `${hours}h`;
  return `${rest}min`;
}

async function loadVideoDurationMap(videoIds: string[]): Promise<Map<string, number>> {
  const uniqueIds = [...new Set(videoIds.filter(Boolean))];
  const map = new Map<string, number>();
  if (uniqueIds.length === 0) return map;

  const sb = getSupabaseAdmin();
  if (!sb) return map;

  const { data, error } = await sb
    .from("videos")
    .select("id, duration_seconds")
    .in("id", uniqueIds);

  if (error) {
    console.error("[BelKou] load video durations:", error.message);
    return map;
  }

  for (const row of data ?? []) {
    const seconds = (row as { id: string; duration_seconds: number | null }).duration_seconds;
    if (seconds && seconds > 0) {
      map.set((row as { id: string }).id, seconds);
    }
  }

  return map;
}

/** Replace lesson.duration with probed video length when available in the videos table. */
export async function enrichCourseWithVideoDurations(course: Course): Promise<Course> {
  const videoIds = getAllLessons(course)
    .map((lesson) => getLessonVideoId(lesson))
    .filter((id): id is string => Boolean(id));

  const durationById = await loadVideoDurationMap(videoIds);
  if (durationById.size === 0) {
    return { ...course, totalDuration: getCourseDisplayDuration(course) };
  }

  const sections = course.sections.map((section) => ({
    ...section,
    lessons: section.lessons.map((lesson) => {
      const videoId = getLessonVideoId(lesson);
      if (!videoId) return lesson;
      const seconds = durationById.get(videoId);
      if (!seconds) return lesson;
      return { ...lesson, duration: secondsToLessonDuration(seconds) };
    }),
  }));

  const updated = { ...course, sections };
  return { ...updated, totalDuration: getCourseDisplayDuration(updated) };
}
