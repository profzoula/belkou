import type { Course } from "@/lib/courses";
import { isBaseCourseSlug } from "@/lib/courses";
import { isCourseLive, isScheduledInFuture } from "@/lib/course-publish";

export type AdminCourse = Omit<Course, "thumbnail"> & {
  thumbnail: {
    gradient: string;
    label: string;
    imageUrl?: string;
  };
  published: boolean;
  isLive: boolean;
  isScheduled: boolean;
  isBase: boolean;
  lessonCount: number;
  videoCount: number;
  missingVimeo: number;
};

export type AdminCourseTab = "published" | "scheduled" | "hidden" | "draft";

export function getCourseMetrics(course: Course) {
  const lessons = course.sections.flatMap((section) => section.lessons);
  const videos = lessons.filter((lesson) => lesson.type === "video");
  const missingVimeo = videos.filter((lesson) => !lesson.vimeo?.trim()).length;
  return {
    lessonCount: lessons.length,
    videoCount: videos.length,
    missingVimeo,
  };
}

export function getAdminCourseTab(course: AdminCourse): AdminCourseTab {
  if (course.missingVimeo > 0) return "draft";
  if (course.isScheduled) return "scheduled";
  if (course.isLive) return "published";
  return "hidden";
}

export function serializeCourseForAdmin(course: Course): AdminCourse {
  const metrics = getCourseMetrics(course);
  return {
    ...course,
    thumbnail: {
      gradient: course.thumbnail.gradient,
      label: course.thumbnail.label,
      ...(course.thumbnail.imageUrl ? { imageUrl: course.thumbnail.imageUrl } : {}),
    },
    published: course.published !== false,
    isLive: isCourseLive(course),
    isScheduled: isScheduledInFuture(course),
    isBase: isBaseCourseSlug(course.slug),
    ...metrics,
  };
}
