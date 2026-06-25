import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { isCourseContentLive } from "@/lib/course-publish";
import { LEGACY_COURSE_SLUG } from "@/lib/course-access";
import { getUserFromAccessToken } from "@/server/supabase-auth";
import { supabaseGetByEmail } from "@/server/supabase-registrations";
import { getResolvedCourseBySlug } from "@/server/site-content";

export type StudentEnrollment = {
  id: string;
  payment_status: "pending" | "paid" | "manual_pending";
  courseSlug: string;
  courseTitle: string;
  instructor: string;
  thumbnailGradient: string;
  thumbnailImageUrl?: string;
  scheduledPublishAt?: string;
  contentLive: boolean;
  progressPercent: number;
  purchasedAt: string;
};

export const getStudentDashboard = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ accessToken: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => {
    const user = await getUserFromAccessToken(data.accessToken);
    if (!user?.email) return { enrollments: [] as StudentEnrollment[] };

    const registration = await supabaseGetByEmail(user.email);
    if (!registration) return { enrollments: [] };

    const slug = registration.course_slug ?? LEGACY_COURSE_SLUG;
    const course = await getResolvedCourseBySlug(slug);

    if (!course) {
      return {
        enrollments: [
          {
            id: registration.id,
            payment_status: registration.payment_status,
            courseSlug: slug,
            courseTitle: "Cours BelKou",
            instructor: "BelKou",
            thumbnailGradient: "from-primary/80 to-primary",
            contentLive: false,
            progressPercent: 0,
            purchasedAt: registration.created_at,
          },
        ],
      };
    }

    return {
      enrollments: [
        {
          id: registration.id,
          payment_status: registration.payment_status,
          courseSlug: course.slug,
          courseTitle: course.title,
          instructor: course.instructor,
          thumbnailGradient: course.thumbnail.gradient,
          thumbnailImageUrl: course.thumbnail.imageUrl,
          scheduledPublishAt: course.scheduledPublishAt,
          contentLive: isCourseContentLive(course),
          progressPercent: 0,
          purchasedAt: registration.created_at,
        },
      ],
    };
  });
