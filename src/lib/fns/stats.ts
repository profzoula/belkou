import { createServerFn } from "@tanstack/react-start";
import { resolveStatsStudentsBase } from "@/lib/site-display";
import { getDb } from "@/server/env";
import { getRegistrationCount } from "@/server/db";

export const getStudentCount = createServerFn({ method: "GET" }).handler(async () => {
  const { getSiteSettings } = await import("@/server/site-content");
  const [settings, db] = await Promise.all([getSiteSettings(), getDb()]);
  const registrations = await getRegistrationCount(db);
  return resolveStatsStudentsBase(settings) + registrations;
});

export const getCatalogCourseCount = createServerFn({ method: "GET" }).handler(async () => {
  const { getPublishedCourseCount } = await import("@/server/site-content");
  return getPublishedCourseCount();
});
