import { BASE_COURSE_SLUGS } from "@/lib/courses";
import { isWelcomePreviewLesson } from "@/lib/courses";
import { isCourseContentLive } from "@/lib/course-publish";
import type { RegistrationRecord } from "@/lib/schemas/registration";

export const LEGACY_COURSE_SLUG = BASE_COURSE_SLUGS[0];

export function registrationCoversCourse(
  registration: Pick<RegistrationRecord, "course_slug">,
  courseSlug: string,
): boolean {
  const regSlug = registration.course_slug ?? LEGACY_COURSE_SLUG;
  return regSlug === courseSlug;
}

export function hasPaidAccessToCourse(
  registration: Pick<RegistrationRecord, "payment_status" | "course_slug"> | null | undefined,
  courseSlug: string,
): boolean {
  if (!registration || registration.payment_status !== "paid") return false;
  return registrationCoversCourse(registration, courseSlug);
}

export type LessonLockReason = "none" | "schedule" | "enrollment";

export function getLessonLockState(
  opts: {
    lesson: { id: string; title: string; preview?: boolean; type?: string };
    course: { published?: boolean; scheduledPublishAt?: string };
    hasPaidAccess: boolean;
  },
  now = Date.now(),
): { locked: boolean; reason: LessonLockReason } {
  const { lesson, course, hasPaidAccess } = opts;
  const contentLive = isCourseContentLive(course, now);

  if (contentLive) {
    if (hasPaidAccess) return { locked: false, reason: "none" };
    if (lesson.preview) return { locked: false, reason: "none" };
    return { locked: true, reason: "enrollment" };
  }

  if (hasPaidAccess) {
    if (lesson.type === "video" && isWelcomePreviewLesson(lesson)) {
      return { locked: false, reason: "none" };
    }
    return { locked: true, reason: "schedule" };
  }

  if (lesson.preview) return { locked: false, reason: "none" };
  return { locked: true, reason: "schedule" };
}
