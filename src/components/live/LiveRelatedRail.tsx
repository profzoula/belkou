import { Link } from "@tanstack/react-router";
import { CourseThumbnailBanner } from "@/components/course/CourseThumbnailBanner";
import { LiveNowBadge } from "@/components/live/LiveNowBadge";
import { formatLiveSchedule, liveEventThumbnail, liveStatusLabel, type PublicLiveListItem } from "@/lib/live";
import { cn } from "@/lib/utils";

export function LiveRelatedRail({
  sessions,
  currentId,
}: {
  sessions: PublicLiveListItem[];
  currentId: string;
}) {
  const related = sessions.filter((session) => session.id !== currentId).slice(0, 8);
  if (related.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-foreground">Autres lives</h2>
      <ul className="space-y-3">
        {related.map((session) => (
          <li key={session.id}>
            <Link
              to="/live/$sessionId"
              params={{ sessionId: session.id }}
              className="group flex gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <CourseThumbnailBanner
                thumbnail={liveEventThumbnail(session, session.course)}
                slug={session.course.slug}
                aspectClass="aspect-video w-[9.5rem] shrink-0"
                className="rounded-lg"
                showLabel={false}
                showIcon={false}
              >
                <LiveNowBadge status={session.status} className="absolute bottom-1.5 right-1.5 z-10" />
              </CourseThumbnailBanner>
              <div className="min-w-0 pt-0.5">
                <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground group-hover:text-primary">
                  {session.title}
                </p>
                <p className="mt-1 truncate text-xs text-muted-foreground">{session.courseTitle}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  <span
                    className={cn(
                      session.status === "live" && "font-semibold text-red-600 dark:text-red-400",
                    )}
                  >
                    {liveStatusLabel(session.status)}
                  </span>
                  {" · "}
                  {formatLiveSchedule(session.scheduledAt)}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
