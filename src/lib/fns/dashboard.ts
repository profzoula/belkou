import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { isCourseContentLive } from "@/lib/course-publish";
import { LEGACY_COURSE_SLUG, registrationCourseKey } from "@/lib/course-access";
import { countLessons } from "@/lib/courses";
import { getDb } from "@/server/env";
import { listRegistrationsByEmail } from "@/server/db";
import { computeProgressPercent, listLessonProgress } from "@/server/lesson-progress";
import { getUserFromAccessToken } from "@/server/supabase-auth";
import { getResolvedCourseBySlug } from "@/server/site-content";

export type StudentEnrollment = {
  id: string;
  payment_status: "pending" | "paid" | "manual_pending";
  courseSlug: string;
  courseTitle: string;
  instructor: string;
  thumbnailGradient: string;
  thumbnailImageUrl?: string;
  scheduledPublishAt?: string;
  contentLive: boolean;
  progressPercent: number;
  purchasedAt: string;
};

export const getStudentDashboard = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ accessToken: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => {
    const user = await getUserFromAccessToken(data.accessToken);
    if (!user?.email) return { enrollments: [] as StudentEnrollment[] };

    const db = await getDb();
    const registrations = await listRegistrationsByEmail(db, user.email);
    if (!registrations.length) return { enrollments: [] };

    const enrollments: StudentEnrollment[] = [];

    for (const registration of registrations) {
      const slug = registrationCourseKey(registration.course_slug);
      const course = await getResolvedCourseBySlug(slug);
      const progressRows = await listLessonProgress(user.email, slug);
      const totalLessons = course ? countLessons(course) : 0;

      if (!course) {
        enrollments.push({
          id: registration.id,
          payment_status: registration.payment_status,
          courseSlug: slug,
          courseTitle: slug === LEGACY_COURSE_SLUG ? "Apps IA avec Cursor & Claude Code" : "Cours BelKou",
          instructor: "BelKou",
          thumbnailGradient: "from-primary/80 to-primary",
          contentLive: false,
          progressPercent: computeProgressPercent(progressRows.length, totalLessons),
          purchasedAt: registration.created_at,
        });
        continue;
      }

      enrollments.push({
        id: registration.id,
        payment_status: registration.payment_status,
        courseSlug: course.slug,
        courseTitle: course.title,
        instructor: course.instructor,
        thumbnailGradient: course.thumbnail.gradient,
        thumbnailImageUrl: course.thumbnail.imageUrl,
        scheduledPublishAt: course.scheduledPublishAt,
        contentLive: isCourseContentLive(course),
        progressPercent: computeProgressPercent(progressRows.length, countLessons(course)),
        purchasedAt: registration.created_at,
      });
    }

    return { enrollments };
  });
