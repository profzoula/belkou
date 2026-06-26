import { BASE_COURSE_SLUGS } from "@/lib/courses";
import { isWelcomePreviewLesson } from "@/lib/courses";
import { isCourseContentLive } from "@/lib/course-publish";
import type { RegistrationRecord } from "@/lib/schemas/registration";

export const LEGACY_COURSE_SLUG = BASE_COURSE_SLUGS[0];

/** Stable key for DB uniqueness and lookups (null/empty → legacy course). */
export function registrationCourseKey(courseSlug?: string | null): string {
  const trimmed = courseSlug?.trim();
  return trimmed || LEGACY_COURSE_SLUG;
}

export function registrationCoversCourse(
  registration: Pick<RegistrationRecord, "course_slug">,
  courseSlug: string,
): boolean {
  return registrationCourseKey(registration.course_slug) === registrationCourseKey(courseSlug);
}

/** Best matching registration row for course access (legacy cohort payers included). */
export function pickRegistrationForCourse(
  rows: RegistrationRecord[],
  courseSlug: string,
): RegistrationRecord | null {
  const key = registrationCourseKey(courseSlug);
  const matching = rows.filter((row) => registrationCourseKey(row.course_slug) === key);
  const paidMatch = matching.find((row) => row.payment_status === "paid");
  if (paidMatch) return paidMatch;
  if (matching[0]) return matching[0];

  if (key !== LEGACY_COURSE_SLUG) return null;

  const paid = rows.filter((row) => row.payment_status === "paid");
  const legacyCohort = paid.find((row) => !row.course_slug?.trim());
  if (legacyCohort) return legacyCohort;

  if (paid.length === 1) return paid[0]!;

  return null;
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
