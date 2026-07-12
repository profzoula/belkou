import { registrationCourseKey } from "@/lib/course-access";
import { supabaseListRegistrations } from "@/server/supabase-registrations";

export async function getPaidEnrollmentCountsByCourse(): Promise<Record<string, number>> {
  const rows = await supabaseListRegistrations();
  const counts: Record<string, number> = {};

  for (const row of rows) {
    if (row.payment_status !== "paid") continue;
    const key = registrationCourseKey(row.course_slug);
    counts[key] = (counts[key] ?? 0) + 1;
  }

  return counts;
}

export async function countPaidEnrollmentsForCourse(courseSlug: string): Promise<number> {
  const counts = await getPaidEnrollmentCountsByCourse();
  return counts[registrationCourseKey(courseSlug)] ?? 0;
}
