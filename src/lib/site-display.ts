import { siteConfig } from "@/lib/site-config";
import type { SiteSettings } from "@/lib/site-settings";

export function resolveCohortStartDate(settings?: Pick<SiteSettings, "cohortStartDate">): string {
  return settings?.cohortStartDate?.trim() || siteConfig.cohortStartDate;
}

export function resolveStatsStudentsBase(settings?: Pick<SiteSettings, "statsStudentsBase">): number {
  const floor = siteConfig.stats.studentsBase;
  const base = settings?.statsStudentsBase;
  const configured = typeof base === "number" && base > 0 ? base : floor;
  return Math.max(configured, floor);
}
