import { createServerFn } from "@tanstack/react-start";
import { resolveCohortStartDate, resolveStatsStudentsBase } from "@/lib/site-display";

export const getPublicSiteDisplay = createServerFn({ method: "GET" }).handler(async () => {
  const { getSiteSettings } = await import("@/server/site-content");
  const settings = await getSiteSettings();
  return {
    cohortStartDate: resolveCohortStartDate(settings),
    statsStudentsBase: resolveStatsStudentsBase(settings),
  };
});
