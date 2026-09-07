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
  const free = session.ticketPrice <= 0;
  const countdown = useLiveCountdown(session.scheduledAt, session.status === "scheduled");
  const priceLabel = formatLivePrice(session.ticketPrice);
  const seats = free ? null : liveReservedLabel(session.reservedCount);
  const showReservedBadge = reserved && !free;

  const dateLine = isLive
    ? "En direct maintenant"
    : isReplay
      ? `Replay · ${formatLiveScheduleShort(session.scheduledAt)}`
      : formatLiveScheduleShort(session.scheduledAt);

  const venue = isStandaloneLiveSlug(session.course.slug)
    ? "En ligne · BelKou"
    : `En ligne · ${session.courseTitle}`;

  // Labels courts : le prix est déjà affiché au-dessus — pas de doublon dans le bouton.
  const ctaLabel = free
    ? isLive
      ? "Regarder"
      : isReplay
        ? "Voir le replay"
        : "Voir le live"
    : isLive
      ? reserved
        ? "Entrer"
        : "Regarder"
      : isReplay
        ? "Replay"
        : reserved
          ? "Place réservée"
          : "Réserver";

  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card">
      <Link
        to="/live/$sessionId"
        params={{ sessionId: session.id }}
        className="block min-w-0 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
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
          {showReservedBadge ? (
            <span className="absolute bottom-2 right-2 z-10 inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-bold text-white">
              <Check className="size-3" aria-hidden />
              Réservé
            </span>
          ) : null}
        </CourseThumbnailBanner>

        <div className="space-y-1 p-3">
          <p
            className={cn(
              "text-xs sm:text-sm",
              isLive ? "font-semibold text-red-600 dark:text-red-400" : "text-muted-foreground",
            )}
          >
            {dateLine}
          </p>
          {countdown ? (
            <p className="text-xs font-medium text-primary">{countdown}</p>
          ) : null}
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground group-hover:underline sm:text-[0.95rem]">
            {session.title}
          </h3>
          <p className="truncate text-xs text-muted-foreground sm:text-sm">{venue}</p>
          <p className="text-sm font-medium text-foreground">
            {priceLabel}
            {seats ? (
              <span className="font-normal text-muted-foreground"> · {seats}</span>
            ) : null}
          </p>
        </div>
      </Link>

      <div className="mt-auto flex min-w-0 items-center gap-2 p-3 pt-0">
        <Button
          asChild
          variant={free || reserved || isReplay ? "secondary" : "default"}
          className="h-9 min-w-0 flex-1 rounded-lg px-2 text-xs sm:text-sm"
        >
          <Link
            to="/live/$sessionId"
            params={{ sessionId: session.id }}
            className="truncate"
          >
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
