import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Course } from "@/lib/courses";
import { getCourseDisplayDuration } from "@/lib/courses";
import { getResolvedCourseBySlug } from "@/server/site-content";

export type PublicCourse = Omit<Course, "thumbnail"> & {
  thumbnail: {
    gradient: string;
    label: string;
    imageUrl?: string;
  };
};

function toPublicCourse(course: Course): PublicCourse {
  return {
    ...course,
    totalDuration: getCourseDisplayDuration(course),
    thumbnail: {
      gradient: course.thumbnail.gradient,
      label: course.thumbnail.label,
      ...(course.thumbnail.imageUrl ? { imageUrl: course.thumbnail.imageUrl } : {}),
    },
  };
}

export const getPublicCourse = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ slug: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => {
    const course = await getResolvedCourseBySlug(data.slug);
    if (!course) return null;
    return toPublicCourse(course);
  });

export const getPublicCourses = createServerFn({ method: "GET" }).handler(async () => {
  const { getPublishedCourses } = await import("@/server/site-content");
  const courses = await getPublishedCourses();
  return courses.map(toPublicCourse);
});
