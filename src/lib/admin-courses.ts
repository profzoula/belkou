import type { Course } from "@/lib/courses";
import { isBaseCourseSlug } from "@/lib/courses";

export type AdminCourse = Omit<Course, "thumbnail"> & {
  thumbnail: {
    gradient: string;
    label: string;
  };
  published: boolean;
  isBase: boolean;
  lessonCount: number;
  videoCount: number;
  missingVimeo: number;
};

export type AdminCourseTab = "published" | "hidden" | "draft";

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
  if (!course.published) return "hidden";
  return "published";
}

export function serializeCourseForAdmin(course: Course): AdminCourse {
  const metrics = getCourseMetrics(course);
  return {
    ...course,
    thumbnail: {
      gradient: course.thumbnail.gradient,
      label: course.thumbnail.label,
    },
    published: course.published !== false,
    isBase: isBaseCourseSlug(course.slug),
    ...metrics,
  };
}
