import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { computeCourseProgressPercent, getAllLessons, getSequenceLessonIds } from "@/lib/courses";
import { isLessonUnlockedInSequence } from "@/lib/course-access";
import { getUserFromAccessToken } from "@/server/supabase-auth";
import { getResolvedCourseBySlug } from "@/server/site-content";
import {
  listLessonProgress,
  markLessonComplete,
  pickLastAccessedLessonId,
  saveLessonPlaybackPosition,
  touchLessonLastAccess,
} from "@/server/lesson-progress";

export const getCourseProgress = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ accessToken: z.string().min(1), courseSlug: z.string().min(1) }).parse(data),
  )
  .handler(async ({ data }) => {
    const empty = {
      completedLessonIds: [] as string[],
      playbackByLessonId: {} as Record<string, number>,
      progressPercent: 0,
      lastLessonId: null as string | null,
    };
    const user = await getUserFromAccessToken(data.accessToken);
    if (!user?.email) return empty;

    const course = await getResolvedCourseBySlug(data.courseSlug);
    if (!course) return empty;

    const rows = await listLessonProgress(user.email, data.courseSlug);
    const lessonIds = getAllLessons(course).map((lesson) => lesson.id);
    const completedLessonIds = rows.filter((row) => row.completed_at).map((row) => row.lesson_id);
    const playbackByLessonId = Object.fromEntries(
      rows
        .filter((row) => row.current_time_seconds > 0)
        .map((row) => [row.lesson_id, row.current_time_seconds]),
    );
    return {
      completedLessonIds,
      playbackByLessonId,
      progressPercent: computeCourseProgressPercent(course, completedLessonIds),
      lastLessonId: pickLastAccessedLessonId(rows, lessonIds),
    };
  });

export const saveLessonLastAccess = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        accessToken: z.string().min(1),
        courseSlug: z.string().min(1),
        lessonId: z.string().min(1),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const user = await getUserFromAccessToken(data.accessToken);
    if (!user?.email) return { ok: false as const };

    await touchLessonLastAccess(user.email, data.courseSlug, data.lessonId);
    return { ok: true as const };
  });

export const saveLessonPlayback = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        accessToken: z.string().min(1),
        courseSlug: z.string().min(1),
        lessonId: z.string().min(1),
        currentTimeSeconds: z.number().min(0),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const user = await getUserFromAccessToken(data.accessToken);
    if (!user?.email) return { ok: false as const };

    await saveLessonPlaybackPosition(
      user.email,
      data.courseSlug,
      data.lessonId,
      data.currentTimeSeconds,
    );
    return { ok: true as const };
  });

export const completeLesson = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        accessToken: z.string().min(1),
        courseSlug: z.string().min(1),
        lessonId: z.string().min(1),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const user = await getUserFromAccessToken(data.accessToken);
    if (!user?.email) throw new Error("Connexion requise.");

    const course = await getResolvedCourseBySlug(data.courseSlug);
    if (!course) throw new Error("Cours introuvable.");

    const orderedLessonIds = getAllLessons(course).map((lesson) => lesson.id);
    const requiredLessonIds = getSequenceLessonIds(course);
    const rows = await listLessonProgress(user.email, data.courseSlug);
    const completedLessonIds = rows.filter((row) => row.completed_at).map((row) => row.lesson_id);

    if (
      !isLessonUnlockedInSequence(
        data.lessonId,
        orderedLessonIds,
        completedLessonIds,
        requiredLessonIds,
      )
    ) {
      throw new Error("Terminez la leçon précédente avant de continuer.");
    }

    await markLessonComplete(user.email, data.courseSlug, data.lessonId);
    const updatedRows = await listLessonProgress(user.email, data.courseSlug);
    const updatedCompleted = updatedRows
      .filter((row) => row.completed_at)
      .map((row) => row.lesson_id);
    return {
      progressPercent: computeCourseProgressPercent(course, updatedCompleted),
    };
  });
