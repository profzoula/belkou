import { BASE_COURSE_SLUGS } from "@/lib/courses";
import {
  getPreviewVideoLessons,
  getSequenceLessonIds,
  isFreeCourse,
  isWelcomePreviewLesson,
  lessonHasVideo,
} from "@/lib/courses";
import type { CourseLesson, CourseSection } from "@/lib/courses";
import { isCourseContentLive } from "@/lib/course-publish";
import { STANDALONE_LIVE_SLUG, liveTicketSlug } from "@/lib/live";
import type { RegistrationRecord } from "@/lib/schemas/registration";
import { isLiveTicketPlan } from "@/lib/schemas/registration";

export const LEGACY_COURSE_SLUG = BASE_COURSE_SLUGS[0];
/** Registration row for the $450 VIP membership (all courses + all lives). */
export const VIP_MEMBERSHIP_SLUG = "__vip__";

export function isPaidVipPlan(plan: string | null | undefined): boolean {
  return plan === "vip";
}

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
  const paidVip = rows.find(
    (row) => row.payment_status === "paid" && isPaidVipPlan(row.plan),
  );
  if (paidVip) return paidVip;

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
  registration: Pick<RegistrationRecord, "payment_status" | "course_slug" | "plan"> | null | undefined,
  courseSlug: string,
): boolean {
  if (!registration || registration.payment_status !== "paid") return false;
  if (isPaidVipPlan(registration.plan)) return true;
  if (isLiveTicketPlan(registration.plan)) return false;
  if (registrationCoversCourse(registration, courseSlug)) return true;
  // Legacy cohort: paid Premium/VIP before course_slug existed
  if (
    registrationCourseKey(courseSlug) === LEGACY_COURSE_SLUG &&
    !registration.course_slug?.trim()
  ) {
    return true;
  }
  return false;
}

/**
 * Tickets are sold per event. Passes bought before that change (`__live__`, or the course slug
 * for a course-linked live) stay valid for every live, since they were sold that way.
 */
export function hasLiveTicketForSession(
  rows: RegistrationRecord[],
  sessionId: string,
  courseSlug: string,
): boolean {
  const ticketSlug = liveTicketSlug(sessionId);
  return rows.some((row) => {
    if (row.payment_status !== "paid" || !isLiveTicketPlan(row.plan)) return false;
    const slug = row.course_slug?.trim() ?? "";
    if (slug === ticketSlug) return true;
    return slug === STANDALONE_LIVE_SLUG || slug === courseSlug.trim();
  });
}

export type LessonLockReason = "none" | "schedule" | "enrollment" | "sequential";

/**
 * `requiredLessonIds` restricts the gate to lessons a student can actually finish, so an
 * empty placeholder in the middle of the curriculum never locks everything after it.
 */
export function isLessonUnlockedInSequence(
  lessonId: string,
  orderedLessonIds: string[],
  completedLessonIds: string[],
  requiredLessonIds?: string[],
): boolean {
  const index = orderedLessonIds.indexOf(lessonId);
  if (index < 0) return false;

  const completed = new Set(completedLessonIds);
  if (completed.has(lessonId)) return true;
  if (index === 0) return true;

  const required = requiredLessonIds ? new Set(requiredLessonIds) : null;
  for (let i = 0; i < index; i += 1) {
    const previousId = orderedLessonIds[i]!;
    if (required && !required.has(previousId)) continue;
    if (!completed.has(previousId)) return false;
  }

  return true;
}

export function getLessonLockState(
  opts: {
    lesson: {
      id: string;
      title: string;
      preview?: boolean;
      type?: string;
      videoId?: string;
      vimeoUrl?: string;
      content?: string;
    };
    course: {
      published?: boolean;
      scheduledPublishAt?: string;
      sections?: CourseSection[];
      price?: number;
    };
    hasPaidAccess: boolean;
    completedLessonIds?: string[];
    orderedLessonIds?: string[];
  },
  now = Date.now(),
): { locked: boolean; reason: LessonLockReason } {
  const { lesson, course, hasPaidAccess, completedLessonIds, orderedLessonIds } = opts;
  const contentLive = isCourseContentLive(course, now);
  const videoLesson = lesson as CourseLesson;

  if (lesson.type === "video" && lesson.preview && lessonHasVideo(videoLesson)) {
    if (!hasPaidAccess) {
      return { locked: false, reason: "none" };
    }
  }

  if (lesson.type === "article" && lesson.preview && (lesson as CourseLesson).content?.trim()) {
    if (!hasPaidAccess) {
      return { locked: false, reason: "none" };
    }
  }

  if (
    !hasPaidAccess &&
    typeof course.price === "number" &&
    isFreeCourse({ price: course.price }) &&
    course.sections?.length
  ) {
    const freePreview = getPreviewVideoLessons({
      sections: course.sections,
      price: course.price,
    }).some((item) => item.id === lesson.id);
    if (freePreview) {
      return { locked: false, reason: "none" };
    }
  }

  if (contentLive) {
    if (!hasPaidAccess) {
      return { locked: true, reason: "enrollment" };
    }

    if (orderedLessonIds?.length && completedLessonIds) {
      const requiredLessonIds = course.sections
        ? getSequenceLessonIds({ sections: course.sections })
        : undefined;
      if (
        !isLessonUnlockedInSequence(
          lesson.id,
          orderedLessonIds,
          completedLessonIds,
          requiredLessonIds,
        )
      ) {
        return { locked: true, reason: "sequential" };
      }
    }

    return { locked: false, reason: "none" };
  }

  if (hasPaidAccess && lesson.type === "video" && isWelcomePreviewLesson(lesson)) {
    return { locked: false, reason: "none" };
  }

  return { locked: true, reason: hasPaidAccess ? "schedule" : "schedule" };
}
