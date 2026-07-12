import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { hasPaidAccessToCourse, pickRegistrationForCourse } from "@/lib/course-access";
import { computeCourseProgressPercent, getAllLessons } from "@/lib/courses";
import { getUserFromAccessToken } from "@/server/supabase-auth";
import { listRegistrationsByEmail } from "@/server/db";
import { normalizeRegistrationEmail } from "@/lib/schemas/registration";
import { getDb } from "@/server/env";
import { getResolvedCourseBySlug } from "@/server/site-content";
import { listLessonProgress } from "@/server/lesson-progress";
import {
  addCourseReview,
  listCourseReviews,
  summarizeCourseReviews,
  type CourseReview,
} from "@/server/course-reviews";

function toPublicReview(review: CourseReview) {
  return {
    id: review.id,
    authorName: review.authorName,
    rating: review.rating,
    text: review.text,
    createdAt: review.createdAt,
  };
}

export const getCourseReviews = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ courseSlug: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => {
    const reviews = await listCourseReviews(data.courseSlug);
    const summary = summarizeCourseReviews(reviews);
    return {
      reviews: reviews.map(toPublicReview),
      averageRating: summary.averageRating,
      count: summary.count,
    };
  });

export const submitCourseReview = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        accessToken: z.string().min(1),
        courseSlug: z.string().min(1),
        rating: z.number().int().min(1).max(5),
        text: z.string().min(10).max(2000),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const user = await getUserFromAccessToken(data.accessToken);
    if (!user?.email) throw new Error("Connexion requise");

    const db = await getDb();
    const email = normalizeRegistrationEmail(user.email);
    const rows = await listRegistrationsByEmail(db, email);
    const registration = pickRegistrationForCourse(rows, data.courseSlug);
    if (!hasPaidAccessToCourse(registration, data.courseSlug)) {
      throw new Error("Accès non autorisé");
    }

    const course = await getResolvedCourseBySlug(data.courseSlug);
    if (!course) throw new Error("Cours introuvable");

    const progressRows = await listLessonProgress(user.email, data.courseSlug);
    const completedLessonIds = progressRows.filter((row) => row.completed_at).map((row) => row.lesson_id);
    const progressPercent = computeCourseProgressPercent(course, completedLessonIds);
    if (progressPercent < 5) {
      throw new Error("Terminez au moins une partie du cours avant de laisser un avis.");
    }

    const result = await addCourseReview({
      courseSlug: data.courseSlug,
      authorName: user.user_metadata?.full_name ?? user.email.split("@")[0] ?? "Étudiant",
      authorEmail: user.email,
      rating: data.rating,
      text: data.text,
    });

    if (!result.ok) throw new Error(result.reason);

    const reviews = await listCourseReviews(data.courseSlug);
    const summary = summarizeCourseReviews(reviews);
    return {
      review: toPublicReview(result.review),
      averageRating: summary.averageRating,
      count: summary.count,
    };
  });
