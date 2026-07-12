import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getUserFromAccessToken } from "@/server/supabase-auth";
import { listLessonNotesForCourse, saveLessonNote } from "@/server/student-notes";

export const getCourseLessonNotes = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ accessToken: z.string().min(1), courseSlug: z.string().min(1) }).parse(data),
  )
  .handler(async ({ data }) => {
    const user = await getUserFromAccessToken(data.accessToken);
    if (!user?.email) return { notesByLessonId: {} as Record<string, string> };

    const notesByLessonId = await listLessonNotesForCourse(user.email, data.courseSlug);
    return { notesByLessonId };
  });

export const saveCourseLessonNote = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        accessToken: z.string().min(1),
        courseSlug: z.string().min(1),
        lessonId: z.string().min(1),
        text: z.string().max(20_000),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const user = await getUserFromAccessToken(data.accessToken);
    if (!user?.email) throw new Error("Connexion requise");

    const result = await saveLessonNote({
      email: user.email,
      courseSlug: data.courseSlug,
      lessonId: data.lessonId,
      text: data.text,
    });

    if (!result.ok) throw new Error(result.reason ?? "Enregistrement impossible");
    return { ok: true as const };
  });
