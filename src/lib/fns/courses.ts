import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Course } from "@/lib/courses";
import { getCourseDisplayDuration, getDisplayedCourseStudentsCount } from "@/lib/courses";
import { hasPaidAccessToCourse, pickRegistrationForCourse } from "@/lib/course-access";
import { stripCourseForPublic, toEnrolledCourse } from "@/lib/public-course";
import { normalizeRegistrationEmail } from "@/lib/schemas/registration";
import { getDb } from "@/server/env";
import { listRegistrationsByEmail } from "@/server/db";
import { getResolvedCourseBySlug } from "@/server/site-content";
import { getUserFromAccessToken } from "@/server/supabase-auth";
import { countPaidEnrollmentsForCourse, getPaidEnrollmentCountsByCourse } from "@/server/enrollment-stats";

export type PublicCourse = Omit<Course, "thumbnail" | "resources"> & {
  thumbnail: {
    gradient: string;
    label: string;
    imageUrl?: string;
  };
  resources?: import("@/lib/course-resources").ClientCourseResource[];
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

export function toPublicCourseShape(course: Course): PublicCourse {
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
    return stripCourseForPublic(toPublicCourseShape(enriched));
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
    return stripCourseForPublic(toPublicCourseShape(enriched));
  });
});

export const getEnrolledCourse = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        courseSlug: z.string().min(1),
        accessToken: z.string().min(1),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const user = await getUserFromAccessToken(data.accessToken);
    if (!user?.email) {
      throw new Error("Connexion requise");
    }

    const db = await getDb();
    const email = normalizeRegistrationEmail(user.email);
    const { reconcilePendingStripePaymentsForEmail } = await import("@/server/stripe-access");
    await reconcilePendingStripePaymentsForEmail(db, email).catch(() => undefined);

    const rows = await listRegistrationsByEmail(db, email);
    const registration = pickRegistrationForCourse(rows, data.courseSlug);
    if (!hasPaidAccessToCourse(registration, data.courseSlug)) {
      throw new Error("Accès non autorisé");
    }

    const course = await getResolvedCourseBySlug(data.courseSlug);
    if (!course) {
      throw new Error("Cours introuvable");
    }

    const enriched = await enrichCourseStudentsCount(course);
    return toEnrolledCourse(enriched, toPublicCourseShape);
  });
