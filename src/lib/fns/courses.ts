import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Course } from "@/lib/courses";
import { getCourseDisplayDuration, getDisplayedCourseStudentsCount } from "@/lib/courses";
import { getResolvedCourseBySlug } from "@/server/site-content";
import { countPaidEnrollmentsForCourse, getPaidEnrollmentCountsByCourse } from "@/server/enrollment-stats";

export type PublicCourse = Omit<Course, "thumbnail"> & {
  thumbnail: {
    gradient: string;
    label: string;
    imageUrl?: string;
  };
};

async function enrichCourseStudentsCount(course: Course): Promise<Course> {
  const paidCount = await countPaidEnrollmentsForCourse(course.slug);
  return {
    ...course,
    studentsCount: getDisplayedCourseStudentsCount({
      studentsCount: Math.max(course.studentsCount, paidCount),
      slug: course.slug,
    }),
  };
}

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
    const enriched = await enrichCourseStudentsCount(course);
    return toPublicCourse(enriched);
  });

export const getPublicCourses = createServerFn({ method: "GET" }).handler(async () => {
  const { getPublishedCourses } = await import("@/server/site-content");
  const courses = await getPublishedCourses();
  const paidCounts = await getPaidEnrollmentCountsByCourse();

  return courses.map((course) => {
    const paidCount = paidCounts[course.slug] ?? 0;
    const enriched = {
      ...course,
      studentsCount: getDisplayedCourseStudentsCount({
        studentsCount: Math.max(course.studentsCount, paidCount),
        slug: course.slug,
      }),
    };
    return toPublicCourse(enriched);
  });
});
