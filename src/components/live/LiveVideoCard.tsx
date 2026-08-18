import { Link } from "@tanstack/react-router";
import { Check, Play } from "lucide-react";
import { CourseThumbnailBanner } from "@/components/course/CourseThumbnailBanner";
import { LiveNowBadge } from "@/components/live/LiveNowBadge";
import { SiteLogo } from "@/components/site/SiteLogo";
import { useLiveCountdown } from "@/hooks/use-live-countdown";
import {
  formatLivePrice,
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
  /** True once the student holds a ticket (or VIP) for this event. */
  reserved?: boolean;
};

function ChannelAvatar({
  session,
  standalone,
  className,
}: {
  session: PublicLiveListItem;
  standalone: boolean;
  className: string;
}) {
  if (standalone) {
    return <SiteLogo className={cn("shrink-0 rounded-full", className)} alt="" />;
  }
  return (
    <CourseThumbnailBanner
      thumbnail={session.course.thumbnail}
      slug={session.course.slug}
      aspectClass={cn("shrink-0", className)}
      className="rounded-full"
      showLabel={false}
      showIcon={false}
      showOverlay={false}
    />
  );
}

/** Top-right corner tag: what this event costs, or that the seat is already held. */
function CornerTag({
  reserved,
  price,
  compact,
}: {
  reserved: boolean;
  price: string;
  compact?: boolean;
}) {
  return (
    <span
      className={cn(
        "absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-md text-[11px] font-bold text-white",
        compact ? "px-1.5 py-0.5" : "px-2 py-1",
        reserved ? "bg-emerald-600" : "bg-black/70",
      )}
    >
      {reserved ? <Check className="size-3" aria-hidden /> : null}
      {reserved ? "Réservé" : price}
    </span>
  );
}

export function LiveVideoCard({ session, featured = false, reserved = false }: LiveVideoCardProps) {
  const standalone = isStandaloneLiveSlug(session.course.slug);
  const channel = standalone ? "BelKou" : session.courseTitle;
  const meta =
    session.status === "live"
      ? liveStatusLabel(session.status)
      : formatLiveSchedule(session.scheduledAt);
  const countdown = useLiveCountdown(session.scheduledAt, session.status === "scheduled");
  const priceLabel = formatLivePrice(session.ticketPrice);
  const ctaLabel =
    session.status === "live"
      ? reserved
        ? "Entrer dans le live"
        : "Regarder en direct"
      : session.status === "ended"
        ? "Voir le replay"
        : reserved
          ? "Ma place est réservée"
          : `Réserver ma place — ${priceLabel}`;

  if (featured) {
    return (
      <Link
        to="/live/$sessionId"
        params={{ sessionId: session.id }}
        className="group block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <div className="relative overflow-hidden rounded-2xl">
          <CourseThumbnailBanner
            thumbnail={liveEventThumbnail(session, session.course)}
            slug={session.course.slug}
            aspectClass="aspect-video"
            className="rounded-2xl"
            showLabel={false}
            showIcon={false}
          >
            <LiveNowBadge
              status={session.status}
              className="absolute left-2 top-2 z-10 px-2 py-1"
            />
            <CornerTag reserved={reserved} price={priceLabel} />
            <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
              <span className="grid size-14 place-items-center rounded-full bg-white/95 text-zinc-950">
                <Play className="size-6 fill-current" aria-hidden />
              </span>
            </div>
          </CourseThumbnailBanner>
        </div>
        <div className="mt-4 flex gap-3 sm:gap-4">
          <ChannelAvatar session={session} standalone={standalone} className="size-10 sm:size-11" />
          <div className="min-w-0">
            <h2 className="line-clamp-2 font-display text-lg font-semibold tracking-tight text-foreground text-balance group-hover:text-primary sm:text-xl md:text-2xl">
              {session.title}
            </h2>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {channel ? `${channel} · ` : null}
              <span
                className={cn(
                  session.status === "live" && "font-medium text-red-600 dark:text-red-400",
                )}
              >
                {meta}
              </span>
            </p>
            {countdown ? (
              <p className="mt-0.5 text-sm font-medium text-primary">Commence {countdown}</p>
            ) : null}
            <span className="mt-3 inline-flex h-10 items-center rounded-full bg-foreground px-5 text-sm font-semibold text-background transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              {ctaLabel}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to="/live/$sessionId"
      params={{ sessionId: session.id }}
      className="group block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
          <LiveNowBadge status={session.status} className="absolute left-2 top-2 z-10" />
          <CornerTag reserved={reserved} price={priceLabel} compact />
          <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
            <span className="grid size-11 place-items-center rounded-full bg-black/70 text-white">
              <Play className="size-4 fill-current" aria-hidden />
            </span>
          </div>
        </CourseThumbnailBanner>
      </div>
      <div className="mt-3 flex gap-3">
        <ChannelAvatar session={session} standalone={standalone} className="size-9" />
        <div className="min-w-0">
          <h3 className="line-clamp-2 font-semibold leading-snug text-foreground group-hover:text-primary">
            {session.title}
          </h3>
          {channel ? (
            <p className="mt-1 truncate text-sm text-muted-foreground">{channel}</p>
          ) : null}
          <p
            className={cn(
              "mt-0.5 text-sm text-muted-foreground",
              session.status === "live" && "font-medium text-red-600 dark:text-red-400",
            )}
          >
            {meta}
          </p>
          {session.status === "scheduled" ? (
            <p className="mt-0.5 text-xs font-medium text-primary">
              {reserved ? "Place réservée" : "Réservation ouverte"}
              {countdown ? ` · ${countdown}` : null}
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
