import { Link } from "@tanstack/react-router";
import { Check, Share2 } from "lucide-react";
import { CourseThumbnailBanner } from "@/components/course/CourseThumbnailBanner";
import { Button } from "@/components/ui/button";
import { useLiveCountdown } from "@/hooks/use-live-countdown";
import {
  formatLivePrice,
  formatLiveScheduleShort,
  isStandaloneLiveSlug,
  liveEventThumbnail,
  liveReservedLabel,
  type PublicLiveListItem,
} from "@/lib/live";
import { absoluteUrl } from "@/lib/seo";
import { shareLink } from "@/lib/share";
import { cn } from "@/lib/utils";

type LiveVideoCardProps = {
  session: PublicLiveListItem;
  /** True once the student holds a ticket (or VIP) for this event. */
  reserved?: boolean;
};

export function LiveVideoCard({ session, reserved = false }: LiveVideoCardProps) {
  const isLive = session.status === "live";
  const isReplay = session.status === "ended";
  const countdown = useLiveCountdown(session.scheduledAt, session.status === "scheduled");
  const priceLabel = formatLivePrice(session.ticketPrice);
  const seats = liveReservedLabel(session.reservedCount);

  const dateLine = isLive
    ? "En direct maintenant"
    : isReplay
      ? `Replay · ${formatLiveScheduleShort(session.scheduledAt)}`
      : formatLiveScheduleShort(session.scheduledAt);

  const venue = isStandaloneLiveSlug(session.course.slug)
    ? "En ligne · BelKou"
    : `En ligne · ${session.courseTitle}`;

  const ctaLabel = isLive
    ? reserved
      ? "Entrer dans le live"
      : "Regarder en direct"
    : isReplay
      ? "Voir le replay"
      : reserved
        ? "Place réservée"
        : `Réserver — ${priceLabel}`;

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      <Link
        to="/live/$sessionId"
        params={{ sessionId: session.id }}
        className="block outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <CourseThumbnailBanner
          thumbnail={liveEventThumbnail(session, session.course)}
          slug={session.course.slug}
          aspectClass="aspect-video"
          showLabel={false}
          showOverlay={false}
        >
          {isLive ? (
            <span className="absolute left-2 top-2 z-10 inline-flex items-center gap-1.5 rounded-md bg-red-600 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
              <span className="size-1.5 animate-pulse rounded-full bg-white" aria-hidden />
              En direct
            </span>
          ) : null}
          {reserved ? (
            <span className="absolute bottom-2 right-2 z-10 inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-bold text-white">
              <Check className="size-3" aria-hidden />
              Réservé
            </span>
          ) : null}
        </CourseThumbnailBanner>

        <div className="p-3">
          <p
            className={cn(
              "truncate text-sm",
              isLive ? "font-semibold text-red-600 dark:text-red-400" : "text-muted-foreground",
            )}
          >
            {dateLine}
            {countdown ? <span className="text-primary"> · {countdown}</span> : null}
          </p>
          <h3 className="mt-0.5 line-clamp-2 font-semibold leading-snug text-foreground group-hover:underline">
            {session.title}
          </h3>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">{venue}</p>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {priceLabel}
            {seats ? ` · ${seats}` : null}
          </p>
        </div>
      </Link>

      <div className="mt-auto flex items-center gap-2 px-3 pb-3">
        <Button
          asChild
          variant={reserved || isReplay ? "secondary" : "default"}
          className="h-9 flex-1 rounded-lg text-sm"
        >
          <Link to="/live/$sessionId" params={{ sessionId: session.id }}>
            {ctaLabel}
          </Link>
        </Button>
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="size-9 shrink-0 rounded-lg"
          aria-label={`Partager ${session.title}`}
          onClick={() =>
            void shareLink({
              title: session.title,
              text: "Live BelKou",
              url: absoluteUrl(`/live/${session.id}`),
            })
          }
        >
          <Share2 className="size-4" aria-hidden />
        </Button>
      </div>
    </article>
  );
}
