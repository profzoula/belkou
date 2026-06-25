import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { hasPaidAccessToCourse } from "@/lib/course-access";
import { isCourseContentLive } from "@/lib/course-publish";
import { getDb } from "@/server/env";
import { getRegistrationByEmail } from "@/server/db";
import { getUserFromAccessToken } from "@/server/supabase-auth";
import { getResolvedCourseBySlug } from "@/server/site-content";

export type CourseAccessStatus = {
  hasPaidAccess: boolean;
  contentLive: boolean;
  scheduledPublishAt?: string;
  paymentStatus: "pending" | "paid" | "manual_pending" | null;
};

export const getCourseAccess = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        courseSlug: z.string().min(1),
        accessToken: z.string().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<CourseAccessStatus> => {
    const course = await getResolvedCourseBySlug(data.courseSlug);
    if (!course) {
      throw new Error("Cours introuvable.");
    }

    const contentLive = isCourseContentLive(course);
    const scheduledPublishAt = course.scheduledPublishAt;

    if (!data.accessToken?.trim()) {
      return {
        hasPaidAccess: false,
        contentLive,
        scheduledPublishAt,
        paymentStatus: null,
      };
    }

    const user = await getUserFromAccessToken(data.accessToken);
    if (!user?.email) {
      return {
        hasPaidAccess: false,
        contentLive,
        scheduledPublishAt,
        paymentStatus: null,
      };
    }

    const db = getDb();
    const registration = await getRegistrationByEmail(db, user.email);

    return {
      hasPaidAccess: hasPaidAccessToCourse(registration, data.courseSlug),
      contentLive,
      scheduledPublishAt,
      paymentStatus: registration?.payment_status ?? null,
    };
  });
