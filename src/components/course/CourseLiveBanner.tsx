import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatLiveSchedule, liveStatusLabel, type PublicLiveListItem } from "@/lib/live";
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
        const live = forCourse.find((session) => session.status === "live");
        const next = forCourse.find((session) => session.status === "scheduled");
        setItem(live ?? next ?? null);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [courseSlug, listFn]);

  if (!item) return null;

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">
          <Radio className="size-3.5" aria-hidden />
          {liveStatusLabel(item.status)}
        </p>
        <p className="mt-1 text-sm font-semibold text-foreground">{item.title}</p>
        <p className="text-xs text-muted-foreground">{formatLiveSchedule(item.scheduledAt)}</p>
      </div>
      <Button asChild size="sm" className="rounded-xl">
        <Link to="/live/$sessionId" params={{ sessionId: item.id }}>
          {item.status === "live" ? "Rejoindre" : "Voir"}
        </Link>
      </Button>
    </div>
  );
}
