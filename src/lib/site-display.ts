import { siteConfig } from "@/lib/site-config";
import type { SiteSettings } from "@/lib/site-settings";

export function resolveCohortStartDate(settings?: Pick<SiteSettings, "cohortStartDate">): string {
  return settings?.cohortStartDate?.trim() || siteConfig.cohortStartDate;
}

export function resolveStatsStudentsBase(settings?: Pick<SiteSettings, "statsStudentsBase">): number {
  const base = settings?.statsStudentsBase;
  if (typeof base === "number" && base > 0) return base;
  return siteConfig.stats.studentsBase;
}
