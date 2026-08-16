import { Link } from "@tanstack/react-router";
import { CourseThumbnailBanner } from "@/components/course/CourseThumbnailBanner";
import { LiveNowBadge } from "@/components/live/LiveNowBadge";
import { formatLiveSchedule, liveEventThumbnail, liveStatusLabel, type PublicLiveListItem } from "@/lib/live";

export function LiveVideoCard({ session }: { session: PublicLiveListItem }) {
  return (
    <Link
      to="/live/$sessionId"
      params={{ sessionId: session.id }}
      className="group block outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <CourseThumbnailBanner
        thumbnail={liveEventThumbnail(session, session.course)}
        slug={session.course.slug}
        aspectClass="aspect-video"
        className="rounded-xl"
        showLabel={false}
        showIcon={false}
      >
        <LiveNowBadge status={session.status} className="absolute bottom-2 right-2 z-10" />
      </CourseThumbnailBanner>
      <div className="mt-3 flex gap-3">
        <CourseThumbnailBanner
          thumbnail={session.course.thumbnail}
          slug={session.course.slug}
          aspectClass="size-9 shrink-0"
          className="rounded-full"
          showLabel={false}
          showIcon={false}
          showOverlay={false}
        />
        <div className="min-w-0">
          <h3 className="line-clamp-2 font-semibold leading-snug text-foreground group-hover:text-primary">
            {session.title}
          </h3>
          <p className="mt-1 truncate text-sm text-muted-foreground">{session.courseTitle}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {session.status === "live" ? liveStatusLabel(session.status) : formatLiveSchedule(session.scheduledAt)}
          </p>
        </div>
      </div>
    </Link>
  );
}
