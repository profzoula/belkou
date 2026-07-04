import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { computeCourseProgressPercent, getAllLessons } from "@/lib/courses";
import { isLessonUnlockedInSequence } from "@/lib/course-access";
import { getUserFromAccessToken } from "@/server/supabase-auth";
import { getResolvedCourseBySlug } from "@/server/site-content";
import { listLessonProgress, markLessonComplete } from "@/server/lesson-progress";

export const getCourseProgress = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ accessToken: z.string().min(1), courseSlug: z.string().min(1) }).parse(data),
  )
  .handler(async ({ data }) => {
    const user = await getUserFromAccessToken(data.accessToken);
    if (!user?.email) return { completedLessonIds: [] as string[], progressPercent: 0 };

    const course = await getResolvedCourseBySlug(data.courseSlug);
    if (!course) return { completedLessonIds: [], progressPercent: 0 };

    const rows = await listLessonProgress(user.email, data.courseSlug);
    const completedLessonIds = rows.map((row) => row.lesson_id);
    return {
      completedLessonIds,
      progressPercent: computeCourseProgressPercent(course, completedLessonIds),
    };
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
    const rows = await listLessonProgress(user.email, data.courseSlug);
    const completedLessonIds = rows.map((row) => row.lesson_id);

    if (
      !isLessonUnlockedInSequence(data.lessonId, orderedLessonIds, completedLessonIds)
    ) {
      throw new Error("Terminez la leçon précédente avant de continuer.");
    }

    await markLessonComplete(user.email, data.courseSlug, data.lessonId);
    const updatedRows = await listLessonProgress(user.email, data.courseSlug);
    const updatedCompleted = updatedRows.map((row) => row.lesson_id);
    return {
      progressPercent: computeCourseProgressPercent(course, updatedCompleted),
    };
  });
