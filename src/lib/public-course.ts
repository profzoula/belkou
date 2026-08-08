import type { ClientCourseResource } from "@/lib/course-resources";
import { lessonHasVideo, type Course, type CourseLesson } from "@/lib/courses";
import type { PublicCourse } from "@/lib/fns/courses";

function lessonAllowsPublicContent(lesson: CourseLesson): boolean {
  if (lesson.preview && lesson.type === "video" && lessonHasVideo(lesson)) {
    return true;
  }
  if (lesson.preview && lesson.type === "article" && lesson.content?.trim()) {
    return true;
  }
  return false;
}

function stripLessonForPublic(lesson: CourseLesson): CourseLesson {
  if (lessonAllowsPublicContent(lesson)) {
    return { ...lesson };
  }

  const { content: _content, videoId: _videoId, vimeoUrl: _vimeoUrl, ...rest } = lesson;
  return rest;
}

/** Remove paid lesson bodies, media IDs, and downloadable resources from catalog/API responses. */
export function stripCourseForPublic(course: PublicCourse): PublicCourse {
  return {
    ...course,
    sections: course.sections.map((section) => ({
      ...section,
      lessons: section.lessons.map(stripLessonForPublic),
    })),
    resources: undefined,
  };
}

export function stripResourcesForClient(
  resources: Course["resources"],
): ClientCourseResource[] | undefined {
  if (!resources?.length) return undefined;
  return resources.map(({ id, title, fileName, contentType, sortOrder }) => ({
    id,
    title,
    fileName,
    contentType,
    sortOrder,
  }));
}

export function toEnrolledCourse(course: Course, format: (c: Course) => PublicCourse): PublicCourse {
  const shaped = format(course);
  return {
    ...shaped,
    resources: stripResourcesForClient(course.resources),
  };
}
