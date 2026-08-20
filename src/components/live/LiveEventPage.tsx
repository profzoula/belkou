import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  CalendarPlus,
  Clock,
  Crown,
  GraduationCap,
  MonitorPlay,
  Share2,
  Ticket,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CourseThumbnailBanner } from "@/components/course/CourseThumbnailBanner";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { useLiveCountdown } from "@/hooks/use-live-countdown";
import {
  formatLivePrice,
  formatLiveSchedule,
  formatLiveScheduleLocal,
  formatLiveScheduleShort,
  isStandaloneLiveSlug,
  liveCtaLabel,
  liveDateChip,
  liveEventThumbnail,
  liveReservedLabel,
  viewerZoneDiffers,
  type PublicLiveSession,
} from "@/lib/live";
import { downloadIcs } from "@/lib/live-calendar";
import { absoluteUrl } from "@/lib/seo";
import { shareLink } from "@/lib/share";
import { cn } from "@/lib/utils";

type LiveEventPageProps = {
  live: PublicLiveSession;
  loggedIn: boolean;
};

/** Cover art keeps its own shape, with a blurred copy filling the empty sides. */
function LiveCover({ live }: { live: PublicLiveSession }) {
  const thumbnail = liveEventThumbnail(live, live.course);
  const image = thumbnail.imageUrl?.trim();

  if (!image) {
    return (
      <CourseThumbnailBanner
        thumbnail={thumbnail}
        slug={live.course.slug}
        aspectClass="aspect-[16/6] max-h-72"
        showLabel={false}
        showOverlay={false}
      />
    );
  }

  return (
    <div className="relative overflow-hidden bg-zinc-900">
      <img
        src={image}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full scale-110 object-cover opacity-50 blur-2xl"
      />
      <img
        src={image}
        alt=""
        className="relative mx-auto max-h-[min(58vh,26rem)] w-auto max-w-full object-contain"
      />
    </div>
  );
}

function DetailRow({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <Icon className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0 text-sm leading-relaxed text-foreground">{children}</div>
    </li>
  );
}

/** Long announcements stay collapsed so the reservation panel remains reachable. */
function EventDescription({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const long = text.length > 280;

  return (
    <div className="mt-5 border-t border-border pt-5">
      <p
        className={cn(
          "whitespace-pre-line text-sm leading-relaxed text-foreground",
          long && !expanded && "line-clamp-4",
        )}
      >
        {text}
      </p>
      {long ? (
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          className="mt-1 text-sm font-semibold text-primary hover:underline"
        >
          {expanded ? "Voir moins" : "Voir plus"}
        </button>
      ) : null}
    </div>
  );
}

export function LiveEventPage({ live, loggedIn }: LiveEventPageProps) {
  const standalone = isStandaloneLiveSlug(live.course.slug);
  const description = live.description.trim() || live.course.description.trim();
  const priceLabel = formatLivePrice(live.liveTicketPrice);
  const free = live.liveTicketPrice <= 0;
  const isLive = live.status === "live";
  const isReplay = live.status === "ended";
  const chip = liveDateChip(live.scheduledAt);
  const countdown = useLiveCountdown(live.scheduledAt, live.status === "scheduled");
  const seats = liveReservedLabel(live.reservedCount);
  const shareUrl = absoluteUrl(`/live/${live.id}`);
  const [localTime, setLocalTime] = useState<string | null>(null);

  useEffect(() => {
    setLocalTime(viewerZoneDiffers() ? formatLiveScheduleLocal(live.scheduledAt) : null);
  }, [live.scheduledAt]);

  const whenLine = isLive
    ? "En direct maintenant"
    : isReplay
      ? `Replay disponible · ${formatLiveScheduleShort(live.scheduledAt)}`
      : formatLiveSchedule(live.scheduledAt);

  const ctaLabel = isLive
    ? liveCtaLabel("Rejoindre le live", live.liveTicketPrice)
    : isReplay
      ? liveCtaLabel("Voir le replay", live.liveTicketPrice)
      : liveCtaLabel("Réserver ma place", live.liveTicketPrice);

  const addToCalendar = () =>
    downloadIcs({
      id: live.id,
      title: live.title,
      description,
      url: shareUrl,
      startIso: live.scheduledAt,
    });

  const reserveButton = (
    <Button asChild className="h-11 w-full rounded-xl text-sm font-semibold">
      {loggedIn ? (
        <Link to="/checkout" search={{ plan: "live", session: live.id }}>
          {ctaLabel}
        </Link>
      ) : (
        <Link to="/login" search={{ redirect: `/live/${live.id}` }}>
          {ctaLabel}
        </Link>
      )}
    </Button>
  );

  return (
    <div className="pt-[var(--site-header-height)]">
      <LiveCover live={live} />

      <div className="site-container pb-10">
        <header className="flex flex-col gap-4 border-b border-border py-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-4">
            <div
              className="hidden w-14 shrink-0 overflow-hidden rounded-xl border border-border bg-card text-center shadow-sm sm:block"
              aria-hidden
            >
              <div className="bg-red-600 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                {chip.month}
              </div>
              <div className="py-1.5 font-display text-xl font-semibold text-foreground">
                {chip.day}
              </div>
            </div>
            <div className="min-w-0">
              <p
                className={cn(
                  "text-sm font-semibold",
                  isLive ? "text-red-600 dark:text-red-400" : "text-primary",
                )}
              >
                {whenLine}
                {countdown ? <span className="text-muted-foreground"> · {countdown}</span> : null}
              </p>
              <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-foreground text-balance sm:text-3xl">
                {live.title}
              </h1>
              <p className="mt-1 truncate text-sm text-muted-foreground">
                En ligne · {standalone ? "BelKou" : live.course.title}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {live.status === "scheduled" ? (
              <Button
                type="button"
                variant="secondary"
                className="h-9 rounded-lg text-sm"
                onClick={addToCalendar}
              >
                <CalendarPlus className="size-4" aria-hidden />
                Calendrier
              </Button>
            ) : null}
            <Button
              type="button"
              variant="secondary"
              className="h-9 rounded-lg text-sm"
              onClick={() =>
                void shareLink({ title: live.title, text: "Live BelKou", url: shareUrl })
              }
            >
              <Share2 className="size-4" aria-hidden />
              Partager
            </Button>
          </div>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start">
          {/* Reservation first on phones: the CTA must not sit below a wall of details. */}
          <Panel padding="md" className="lg:sticky lg:top-24 lg:col-start-2 lg:row-start-1">
            {live.canWatch ? (
              <>
                <p className="font-display text-lg font-semibold tracking-tight">Place réservée</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {live.status === "scheduled"
                    ? `Cette page ouvre le direct toute seule ${countdown ?? "au démarrage"}.`
                    : "Le replay se prépare — revenez dans un moment."}
                </p>
                {live.status === "scheduled" ? (
                  <Button
                    type="button"
                    variant="secondary"
                    className="mt-4 h-11 w-full rounded-xl text-sm font-semibold"
                    onClick={addToCalendar}
                  >
                    <CalendarPlus className="size-4" aria-hidden />
                    Ajouter au calendrier
                  </Button>
                ) : null}
              </>
            ) : (
              <>
                <p className="font-display text-2xl font-semibold tracking-tight">{priceLabel}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isReplay ? "Accès au replay de cette session." : "Une place pour ce live."}
                </p>
                <div className="mt-4">{reserveButton}</div>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  {live.status === "scheduled"
                    ? `Le direct commence ${formatLiveScheduleShort(live.scheduledAt)}. Le replay reste disponible ici après la session.`
                    : "Le replay reste disponible sur cette page."}
                </p>
              </>
            )}
          </Panel>

          <Panel padding="md" className="lg:col-start-1 lg:row-start-1">
            <h2 className="font-display text-lg font-semibold tracking-tight">Détails</h2>
            <ul className="mt-4 space-y-3.5">
              {seats ? (
                <DetailRow icon={Users}>
                  <span className="font-medium">{seats}</span>
                </DetailRow>
              ) : null}
              <DetailRow icon={GraduationCap}>
                {standalone ? (
                  "Organisé par BelKou"
                ) : (
                  <>
                    Rattaché au cours{" "}
                    <Link
                      to="/courses/$slug"
                      params={{ slug: live.course.slug }}
                      className="font-medium text-primary hover:underline"
                    >
                      {live.course.title}
                    </Link>
                  </>
                )}
              </DetailRow>
              <DetailRow icon={Clock}>
                {formatLiveSchedule(live.scheduledAt)}
                {localTime ? (
                  <span className="block text-muted-foreground">Chez vous : {localTime}</span>
                ) : null}
              </DetailRow>
              <DetailRow icon={MonitorPlay}>
                Le direct s&apos;ouvre sur cette page — rien à installer.
                {live.status === "scheduled" ? " La page bascule toute seule au démarrage." : null}
              </DetailRow>
              <DetailRow icon={Ticket}>
                {free ? "Gratuit — réservation requise" : `${priceLabel} pour ce live`}
                {standalone ? null : (
                  <span className="block text-muted-foreground">
                    Non inclus dans l&apos;achat du cours.
                  </span>
                )}
              </DetailRow>
              <DetailRow icon={Crown}>
                <span className="text-muted-foreground">Offert aux membres VIP.</span>
              </DetailRow>
            </ul>

            {description ? <EventDescription text={description} /> : null}
          </Panel>
        </div>
      </div>
    </div>
  );
}
