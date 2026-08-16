import { Link } from "@tanstack/react-router";
import { Play } from "lucide-react";
import { CourseThumbnailBanner } from "@/components/course/CourseThumbnailBanner";
import { LiveNowBadge } from "@/components/live/LiveNowBadge";
import { SiteLogo } from "@/components/site/SiteLogo";
import {
  formatLiveSchedule,
  isStandaloneLiveSlug,
  liveEventThumbnail,
  liveStatusLabel,
  type PublicLiveListItem,
} from "@/lib/live";
import { cn } from "@/lib/utils";

type LiveVideoCardProps = {
  session: PublicLiveListItem;
  featured?: boolean;
};

export function LiveVideoCard({ session, featured = false }: LiveVideoCardProps) {
  const standalone = isStandaloneLiveSlug(session.course.slug);
  const channel = standalone ? "BelKou" : session.courseTitle;
  const meta =
    session.status === "live" ? liveStatusLabel(session.status) : formatLiveSchedule(session.scheduledAt);

  if (featured) {
    return (
      <Link
        to="/live/$sessionId"
        params={{ sessionId: session.id }}
        className="group relative block overflow-hidden rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <CourseThumbnailBanner
          thumbnail={liveEventThumbnail(session, session.course)}
          slug={session.course.slug}
          aspectClass="aspect-video"
          className="rounded-2xl"
          showLabel={false}
          showIcon={false}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/10" />
          <LiveNowBadge status={session.status} className="absolute left-3 top-3 z-10 rounded-md px-2 py-1" />
          <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
            <span className="grid size-14 place-items-center rounded-full bg-white/95 text-zinc-950 shadow-lg">
              <Play className="size-6 fill-current" aria-hidden />
            </span>
          </div>
          <div className="absolute inset-x-0 bottom-0 z-10 space-y-2 p-4 sm:p-6">
            <h2 className="font-display text-xl font-semibold tracking-tight text-white text-balance sm:text-2xl md:text-3xl">
              {session.title}
            </h2>
            <p className="text-sm text-white/75">
              {channel ? `${channel} · ` : null}
              {meta}
            </p>
            <span className="mt-1 inline-flex h-10 items-center rounded-full bg-white px-5 text-sm font-semibold text-zinc-950">
              {session.status === "live" ? "Regarder en direct" : "Voir le live"}
            </span>
          </div>
        </CourseThumbnailBanner>
      </Link>
    );
  }

  return (
    <Link
      to="/live/$sessionId"
      params={{ sessionId: session.id }}
      className="group block outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative overflow-hidden rounded-xl">
        <CourseThumbnailBanner
          thumbnail={liveEventThumbnail(session, session.course)}
          slug={session.course.slug}
          aspectClass="aspect-video"
          className="rounded-xl transition-transform duration-300 group-hover:scale-[1.02]"
          showLabel={false}
          showIcon={false}
        >
          <LiveNowBadge status={session.status} className="absolute bottom-2 right-2 z-10" />
          <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
            <span className="grid size-11 place-items-center rounded-full bg-black/70 text-white">
              <Play className="size-4 fill-current" aria-hidden />
            </span>
          </div>
        </CourseThumbnailBanner>
      </div>
      <div className="mt-3 flex gap-3">
        {standalone ? (
          <SiteLogo className="size-9 shrink-0 rounded-full" alt="" />
        ) : (
          <CourseThumbnailBanner
            thumbnail={session.course.thumbnail}
            slug={session.course.slug}
            aspectClass="size-9 shrink-0"
            className="rounded-full"
            showLabel={false}
            showIcon={false}
            showOverlay={false}
          />
        )}
        <div className="min-w-0">
          <h3 className="line-clamp-2 font-semibold leading-snug text-foreground group-hover:text-primary">
            {session.title}
          </h3>
          {channel ? (
            <p className="mt-1 truncate text-sm text-muted-foreground">{channel}</p>
          ) : null}
          <p className={cn("mt-0.5 text-sm text-muted-foreground", session.status === "live" && "font-medium text-red-600 dark:text-red-400")}>
            {meta}
          </p>
        </div>
      </div>
    </Link>
  );
}
