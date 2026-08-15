import { isCourseContentLive } from "@/lib/course-publish";
import {
  LEGACY_COURSE_SLUG,
  pickRegistrationForCourse,
  registrationCourseKey,
} from "@/lib/course-access";
import {
  computeCourseProgressPercent,
  getAllLessons,
  getFirstPreviewVideoLesson,
  getResumeLesson,
  getWelcomePreviewLesson,
} from "@/lib/courses";
import { normalizeRegistrationEmail } from "@/lib/schemas/registration";
import { getDb } from "@/server/env";
import { listRegistrationsByEmail } from "@/server/db";
import { ensureFreeCourseEnrollment } from "@/server/course-enrollment";
import {
  listAllLessonProgressForEmail,
  listDistinctCourseSlugsForEmail,
  pickLastAccessedLessonId,
} from "@/server/lesson-progress";
import { reconcilePendingStripePaymentsForEmail } from "@/server/stripe-access";
import { getUserFromAccessToken } from "@/server/supabase-auth";
import { getResolvedCourses } from "@/server/site-content";
import { isLiveTicketPlan } from "@/lib/schemas/registration";

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

export async function loadStudentEnrollments(accessToken: string): Promise<StudentEnrollment[]> {
  const user = await getUserFromAccessToken(accessToken);
  if (!user?.email) return [];

  const db = await getDb();
  const email = normalizeRegistrationEmail(user.email);
  const fullName =
    (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name) ||
    (typeof user.user_metadata?.name === "string" && user.user_metadata.name) ||
    undefined;

  const progressSlugs = await listDistinctCourseSlugsForEmail(email);
  for (const slug of progressSlugs) {
    await ensureFreeCourseEnrollment(db, { email, courseSlug: slug, fullName }).catch(
      () => undefined,
    );
  }

  // Do not block dashboard rendering on Stripe API calls.
  // Reconciliation still happens in webhook/success verification and can run in the background here.
  void reconcilePendingStripePaymentsForEmail(db, email).catch((error) => {
    console.warn("[BelKou] enrollment Stripe reconcile:", error);
  });

  const registrations = await listRegistrationsByEmail(db, email);
  if (!registrations.length) return [];

  const courseSlugs = new Set<string>();
  for (const registration of registrations) {
    courseSlugs.add(registrationCourseKey(registration.course_slug));
  }
  if (registrations.some((r) => r.payment_status === "paid" && !r.course_slug?.trim())) {
    courseSlugs.add(LEGACY_COURSE_SLUG);
  }

  const [resolvedCourses, progressByCourse] = await Promise.all([
    getResolvedCourses(),
    listAllLessonProgressForEmail(email),
  ]);
  const courseBySlug = new Map(resolvedCourses.map((course) => [course.slug, course]));

  const enrollments: StudentEnrollment[] = [];

  for (const slug of courseSlugs) {
    const registration = pickRegistrationForCourse(registrations, slug);
    if (!registration) continue;
    if (isLiveTicketPlan(registration.plan) && registration.payment_status === "paid") continue;

    const course = courseBySlug.get(slug);
    const progressRows = progressByCourse[slug] ?? [];
    const completedLessonIds = progressRows
      .filter((row) => row.completed_at)
      .map((row) => row.lesson_id);

    if (!course) {
      enrollments.push({
        id: registration.id,
        payment_status: registration.payment_status,
        courseSlug: slug,
        courseTitle:
          slug === LEGACY_COURSE_SLUG ? "Apps IA avec Cursor & Claude Code" : "Cours BelKou",
        instructor: "BelKou",
        thumbnailGradient: "from-primary/80 to-primary",
        contentLive: false,
        progressPercent: 0,
        purchasedAt: registration.created_at,
      });
      continue;
    }

    const lastLessonId = pickLastAccessedLessonId(
      progressRows,
      getAllLessons(course).map((lesson) => lesson.id),
    );

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
      progressPercent: computeCourseProgressPercent(course, completedLessonIds),
      purchasedAt: registration.created_at,
      welcomeLessonId:
        getFirstPreviewVideoLesson(course)?.id ?? getWelcomePreviewLesson(course)?.id,
      continueLessonId: getResumeLesson(course, { completedLessonIds, lastLessonId })?.id,
    });
  }

  enrollments.sort((a, b) => Date.parse(b.purchasedAt) - Date.parse(a.purchasedAt));
  return enrollments;
}
