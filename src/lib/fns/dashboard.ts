import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { isCourseContentLive } from "@/lib/course-publish";
import {
  LEGACY_COURSE_SLUG,
  pickRegistrationForCourse,
  registrationCourseKey,
} from "@/lib/course-access";
import {
  countLessons,
  getFirstPreviewVideoLesson,
  getNextLessonToWatch,
  getWelcomePreviewLesson,
} from "@/lib/courses";
import { normalizeRegistrationEmail } from "@/lib/schemas/registration";
import { getDb } from "@/server/env";
import { listRegistrationsByEmail } from "@/server/db";
import { ensureFreeCourseEnrollment } from "@/server/course-enrollment";
import { computeProgressPercent, listDistinctCourseSlugsForEmail, listLessonProgress } from "@/server/lesson-progress";
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
  welcomeLessonId?: string;
  continueLessonId?: string;
};

export const getStudentDashboard = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ accessToken: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => {
    const user = await getUserFromAccessToken(data.accessToken);
    if (!user?.email) return { enrollments: [] as StudentEnrollment[] };

    const db = await getDb();
    const email = normalizeRegistrationEmail(user.email);
    const fullName =
      (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name) ||
      (typeof user.user_metadata?.name === "string" && user.user_metadata.name) ||
      undefined;

    const progressSlugs = await listDistinctCourseSlugsForEmail(email);
    for (const slug of progressSlugs) {
      await ensureFreeCourseEnrollment(db, { email, courseSlug: slug, fullName }).catch(() => undefined);
    }

    const registrations = await listRegistrationsByEmail(db, email);
    if (!registrations.length) return { enrollments: [] };

    const courseSlugs = new Set<string>();
    for (const registration of registrations) {
      courseSlugs.add(registrationCourseKey(registration.course_slug));
    }
    if (registrations.some((r) => r.payment_status === "paid" && !r.course_slug?.trim())) {
      courseSlugs.add(LEGACY_COURSE_SLUG);
    }

    const enrollments: StudentEnrollment[] = [];

    for (const slug of courseSlugs) {
      const registration = pickRegistrationForCourse(registrations, slug);
      if (!registration) continue;

      const course = await getResolvedCourseBySlug(slug);
      const progressRows = await listLessonProgress(email, slug);
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
        welcomeLessonId: getFirstPreviewVideoLesson(course)?.id ?? getWelcomePreviewLesson(course)?.id,
        continueLessonId: getNextLessonToWatch(
          course,
          progressRows.map((row) => row.lesson_id),
        )?.id,
      });
    }

    enrollments.sort((a, b) => Date.parse(b.purchasedAt) - Date.parse(a.purchasedAt));

    return { enrollments };
  });
