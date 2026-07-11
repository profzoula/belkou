import type { Course, CourseLesson } from "@/lib/courses";
import { isBaseCourseSlug, lessonHasVideo } from "@/lib/courses";
import { isCourseContentLive, isCourseListed, isScheduledInFuture } from "@/lib/course-publish";

export type AdminCourse = Omit<Course, "thumbnail"> & {
  thumbnail: {
    gradient: string;
    label: string;
    imageUrl?: string;
  };
  published: boolean;
  isLive: boolean;
  isListed: boolean;
  isScheduled: boolean;
  isBase: boolean;
  lessonCount: number;
  videoCount: number;
  missingVideo: number;
};

export type AdminCourseTab = "published" | "scheduled" | "hidden" | "draft";

export function getCourseMetrics(course: { sections: { lessons: CourseLesson[] }[] }) {
  const lessons = course.sections.flatMap((section) => section.lessons);
  const videos = lessons.filter((lesson) => lesson.type === "video");
  const missingVideo = videos.filter((lesson) => !lessonHasVideo(lesson)).length;
  return {
    lessonCount: lessons.length,
    videoCount: videos.length,
    missingVideo,
  };
}

export function getAdminCourseTab(course: AdminCourse): AdminCourseTab {
  if (course.isScheduled) return "scheduled";
  if (course.isLive) return "published";
  if (course.missingVideo > 0) return "draft";
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
    isLive: isCourseContentLive(course),
    isListed: isCourseListed(course),
    isScheduled: isScheduledInFuture(course),
    isBase: isBaseCourseSlug(course.slug),
    ...metrics,
  };
}
