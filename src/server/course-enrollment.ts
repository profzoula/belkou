import { pickRegistrationForCourse } from "@/lib/course-access";
import { isFreeCourse } from "@/lib/courses";
import { normalizeRegistrationEmail } from "@/lib/schemas/registration";
import type { RegistrationRecord } from "@/lib/schemas/registration";
import { listRegistrationsByEmail, saveRegistration } from "@/server/db";
import { getResolvedCourseBySlug } from "@/server/site-content";

function displayNameFromEmail(email: string, fullName?: string): string {
  const trimmed = fullName?.trim();
  if (trimmed) return trimmed;
  return email.split("@")[0] || "Étudiant";
}

export async function ensureFreeCourseEnrollment(
  db: Awaited<ReturnType<typeof import("@/server/env").getDb>>,
  params: { email: string; courseSlug: string; fullName?: string },
): Promise<RegistrationRecord | null> {
  const course = await getResolvedCourseBySlug(params.courseSlug, { fresh: true });
  if (!course || !isFreeCourse(course)) return null;

  const email = normalizeRegistrationEmail(params.email);
  const rows = await listRegistrationsByEmail(db, email);
  const existing = pickRegistrationForCourse(rows, params.courseSlug);

  if (existing?.payment_status === "paid") {
    return existing;
  }

  // Never upgrade a pending/manual checkout to free access — those rows mean a
  // paid purchase was started. Free enrollments are created as new rows only.
  if (existing) {
    return existing;
  }

  return saveRegistration(
    db,
    {
      full_name: displayNameFromEmail(email, params.fullName),
      email,
      whatsapp: "—",
      country: "HT",
      level: "beginner",
      plan: "premium",
      course_slug: params.courseSlug,
    },
    { payment_status: "paid" },
  );
}
