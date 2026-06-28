import { createServerFn } from "@tanstack/react-start";
import { siteConfig } from "@/lib/site-config";
import { getDb } from "@/server/env";
import { getRegistrationCount } from "@/server/db";

export const getStudentCount = createServerFn({ method: "GET" }).handler(async () => {
  const db = await getDb();
  const registrations = await getRegistrationCount(db);
  return siteConfig.stats.studentsBase + registrations;
});

export const getCatalogCourseCount = createServerFn({ method: "GET" }).handler(async () => {
  const { getPublishedCourseCount } = await import("@/server/site-content");
  return getPublishedCourseCount();
});
