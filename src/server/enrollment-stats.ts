import { LEGACY_COURSE_SLUG, VIP_MEMBERSHIP_SLUG, registrationCourseKey } from "@/lib/course-access";
import { STANDALONE_LIVE_SLUG } from "@/lib/live";
import { getSupabaseAdmin, supabaseListRegistrations } from "@/server/supabase-registrations";

export async function getPaidEnrollmentCountsByCourse(): Promise<Record<string, number>> {
  const rows = await supabaseListRegistrations();
  const counts: Record<string, number> = {};

  for (const row of rows) {
    if (row.payment_status !== "paid") continue;
    if (row.plan === "live" || row.plan === "vip") continue;
    const key = registrationCourseKey(row.course_slug);
    if (key === VIP_MEMBERSHIP_SLUG || key === STANDALONE_LIVE_SLUG) continue;
    counts[key] = (counts[key] ?? 0) + 1;
  }

  return counts;
}

export async function countPaidEnrollmentsForCourse(courseSlug: string): Promise<number> {
  const sb = getSupabaseAdmin();
  if (!sb) {
    const counts = await getPaidEnrollmentCountsByCourse();
    return counts[registrationCourseKey(courseSlug)] ?? 0;
  }

  const key = registrationCourseKey(courseSlug);
  const { count: explicitCount, error: explicitError } = await sb
    .from("registrations")
    .select("*", { count: "exact", head: true })
    .eq("payment_status", "paid")
    .eq("course_slug", key)
    .neq("plan", "live");

  if (explicitError) {
    const counts = await getPaidEnrollmentCountsByCourse();
    return counts[key] ?? 0;
  }

  // Legacy paid rows may have empty/null course_slug.
  if (key !== LEGACY_COURSE_SLUG) {
    return explicitCount ?? 0;
  }

  const { count: nullCount } = await sb
    .from("registrations")
    .select("*", { count: "exact", head: true })
    .eq("payment_status", "paid")
    .is("course_slug", null);

  const { count: emptyCount } = await sb
    .from("registrations")
    .select("*", { count: "exact", head: true })
    .eq("payment_status", "paid")
    .eq("course_slug", "");

  return (explicitCount ?? 0) + (nullCount ?? 0) + (emptyCount ?? 0);
}
