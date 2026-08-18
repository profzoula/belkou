import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseThumbnailBanner } from "@/components/course/CourseThumbnailBanner";
import {
  formatLivePrice,
  formatLiveSchedule,
  liveEventThumbnail,
  liveStatusLabel,
  type PublicLiveListItem,
} from "@/lib/live";
import { listPublicLiveSessions } from "@/lib/fns/live";

export function CourseLiveBanner({ courseSlug }: { courseSlug: string }) {
  const listFn = useServerFn(listPublicLiveSessions);
  const [item, setItem] = useState<PublicLiveListItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    listFn()
      .then((sessions) => {
        if (cancelled) return;
        const forCourse = sessions.filter((session) => session.courseSlug === courseSlug);
        const live =
          forCourse.find((session) => session.status === "live") ??
          sessions.find((session) => session.status === "live");
        const next =
          forCourse.find((session) => session.status === "scheduled") ??
          sessions.find((session) => session.status === "scheduled");
        setItem(live ?? next ?? null);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [courseSlug, listFn]);

  if (!item) return null;

  return (
    <div className="mb-5 flex flex-col gap-3 overflow-hidden rounded-2xl border border-red-500/25 bg-red-500/[0.07] p-3 sm:flex-row sm:items-center sm:justify-between sm:pr-4">
      <div className="flex min-w-0 items-center gap-3">
        <CourseThumbnailBanner
          thumbnail={liveEventThumbnail(item, item.course)}
          slug={item.course.slug}
          aspectClass="aspect-video w-28 shrink-0 sm:w-32"
          className="rounded-lg"
          showLabel={false}
          showIcon={false}
        />
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">
            <Radio className="size-3.5" aria-hidden />
            {liveStatusLabel(item.status)}
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-foreground">{item.title}</p>
          <p className="text-xs text-muted-foreground">{formatLiveSchedule(item.scheduledAt)}</p>
        </div>
      </div>
      <Button asChild size="sm" className="rounded-full">
        <Link to="/live/$sessionId" params={{ sessionId: item.id }}>
          {item.status === "live"
            ? "Regarder en direct"
            : `Réserver — ${formatLivePrice(item.ticketPrice)}`}
        </Link>
      </Button>
    </div>
  );
}
