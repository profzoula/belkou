import { BASE_COURSE_SLUGS } from "@/lib/courses";
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
    preview?: boolean;
    course: { published?: boolean; scheduledPublishAt?: string };
    hasPaidAccess: boolean;
  },
  now = Date.now(),
): { locked: boolean; reason: LessonLockReason } {
  if (opts.preview) return { locked: false, reason: "none" };
  const contentLive = isCourseContentLive(opts.course, now);
  if (!contentLive) return { locked: true, reason: "schedule" };
  if (!opts.hasPaidAccess) return { locked: true, reason: "enrollment" };
  return { locked: false, reason: "none" };
}
