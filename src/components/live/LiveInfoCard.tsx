import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarPlus, Radio, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useLiveCountdown } from "@/hooks/use-live-countdown";
import {
  formatLivePrice,
  formatLiveSchedule,
  formatLiveScheduleLocal,
  isStandaloneLiveSlug,
  liveStatusLabel,
  viewerZoneDiffers,
  type PublicLiveSession,
} from "@/lib/live";
import { downloadIcs } from "@/lib/live-calendar";
import { absoluteUrl } from "@/lib/seo";
import { cn } from "@/lib/utils";

type LiveInfoCardProps = {
  live: PublicLiveSession;
  loggedIn: boolean;
  watching?: boolean;
};

function LiveEventActions({ live }: { live: PublicLiveSession }) {
  const shareUrl = absoluteUrl(`/live/${live.id}`);

  const share = async () => {
    const data = { title: live.title, text: "Live BelKou", url: shareUrl };
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share(data);
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Lien copié.");
    } catch {
      /* the reader cancelled the share sheet */
    }
  };

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {live.status === "scheduled" ? (
        <Button
          type="button"
          variant="secondary"
          className="h-9 rounded-full px-4 text-xs"
          onClick={() =>
            downloadIcs({
              id: live.id,
              title: live.title,
              description: live.description || live.course.description,
              url: shareUrl,
              startIso: live.scheduledAt,
            })
          }
        >
          <CalendarPlus className="size-4" aria-hidden />
          Ajouter au calendrier
        </Button>
      ) : null}
      <Button
        type="button"
        variant="secondary"
        className="h-9 rounded-full px-4 text-xs"
        onClick={() => void share()}
      >
        <Share2 className="size-4" aria-hidden />
        Partager
      </Button>
    </div>
  );
}

export function LiveInfoCard({ live, loggedIn, watching = false }: LiveInfoCardProps) {
  const standalone = isStandaloneLiveSlug(live.course.slug);
  const description = live.description.trim() || live.course.description.trim();
  const priceLabel = formatLivePrice(live.liveTicketPrice);
  const free = live.liveTicketPrice <= 0;
  const isLive = live.status === "live";
  const countdown = useLiveCountdown(live.scheduledAt, live.status === "scheduled");
  const [localTime, setLocalTime] = useState<string | null>(null);

  useEffect(() => {
    setLocalTime(viewerZoneDiffers() ? formatLiveScheduleLocal(live.scheduledAt) : null);
  }, [live.scheduledAt]);

  const ctaLabel =
    live.status === "scheduled"
      ? free
        ? "Réserver ma place — gratuit"
        : `Réserver ma place — ${priceLabel}`
      : live.status === "ended"
        ? `Voir le replay — ${priceLabel}`
        : `Rejoindre le live — ${priceLabel}`;

  return (
    <div className="text-left">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-white",
            isLive ? "bg-red-600" : "bg-white/15",
          )}
        >
          {isLive ? <Radio className="size-3" aria-hidden /> : null}
          {liveStatusLabel(live.status)}
        </span>
        <span className="text-sm text-zinc-400">{formatLiveSchedule(live.scheduledAt)}</span>
        {countdown ? (
          <span className="text-sm font-medium text-white/85">· {countdown}</span>
        ) : null}
      </div>
      {localTime ? <p className="mt-1 text-xs text-zinc-500">Chez vous : {localTime}</p> : null}

      <h1 className="mt-3 font-display text-xl font-semibold tracking-tight text-white text-balance sm:text-2xl">
        {live.title}
      </h1>
      <p className="mt-1.5 text-sm text-zinc-400">{standalone ? "BelKou" : live.course.title}</p>
      <p className="mt-2 text-xs text-zinc-500">
        {free
          ? "Live gratuit · réservation requise"
          : standalone
            ? `${priceLabel} pour ce live · offert avec le VIP`
            : `${priceLabel} pour ce live · non inclus dans le cours · offert avec le VIP`}
        {/* A lone seat is not social proof, so the count only appears once a room forms. */}
        {live.reservedCount >= 3 ? (
          <span className="text-zinc-400"> · {live.reservedCount} places réservées</span>
        ) : null}
      </p>
      {description ? (
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-400">{description}</p>
      ) : null}

      {!live.canWatch ? (
        <div className="mt-5">
          <Button asChild className="h-11 min-w-[10.5rem] rounded-full px-6">
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
          {live.status === "scheduled" ? (
            <p className="mt-2 text-xs text-zinc-400">
              Réservez maintenant — le direct s&apos;ouvre {formatLiveSchedule(live.scheduledAt)}.
            </p>
          ) : null}
        </div>
      ) : live.status === "scheduled" ? (
        <div className="mt-5">
          <p className="text-sm font-medium text-white/85">
            Place réservée — cette page ouvre le direct toute seule {countdown ?? "au démarrage"}.
          </p>
        </div>
      ) : live.status === "ended" && !watching ? (
        <p className="mt-5 text-sm font-medium text-white/85">Replay en préparation.</p>
      ) : !watching && !standalone ? (
        <Button asChild variant="secondary" className="mt-5 h-11 min-w-[10.5rem] rounded-full px-6">
          <Link to="/courses/$slug" params={{ slug: live.course.slug }}>
            Voir le cours
          </Link>
        </Button>
      ) : null}

      <LiveEventActions live={live} />
    </div>
  );
}
