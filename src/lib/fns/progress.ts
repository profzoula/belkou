import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { countLessons } from "@/lib/courses";
import { getUserFromAccessToken } from "@/server/supabase-auth";
import { getResolvedCourseBySlug } from "@/server/site-content";
import {
  computeProgressPercent,
  listLessonProgress,
  markLessonComplete,
} from "@/server/lesson-progress";

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
    const total = countLessons(course);
    return {
      completedLessonIds: rows.map((row) => row.lesson_id),
      progressPercent: computeProgressPercent(rows.length, total),
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

    await markLessonComplete(user.email, data.courseSlug, data.lessonId);
    const course = await getResolvedCourseBySlug(data.courseSlug);
    const rows = await listLessonProgress(user.email, data.courseSlug);
    const total = course ? countLessons(course) : 0;
    return {
      progressPercent: computeProgressPercent(rows.length, total),
    };
  });
