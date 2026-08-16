import { Link } from "@tanstack/react-router";
import { Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  formatLivePrice,
  formatLiveSchedule,
  isStandaloneLiveSlug,
  liveStatusLabel,
  type PublicLiveSession,
} from "@/lib/live";

type LiveInfoCardProps = {
  live: PublicLiveSession;
  loggedIn: boolean;
  watching?: boolean;
};

export function LiveInfoCard({ live, loggedIn, watching = false }: LiveInfoCardProps) {
  const standalone = isStandaloneLiveSlug(live.course.slug);
  const description = live.description.trim() || live.course.description.trim();
  const priceLabel = formatLivePrice(live.liveTicketPrice);
  const free = live.liveTicketPrice <= 0;
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
        <span className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
          {live.status === "live" ? <Radio className="size-3" aria-hidden /> : null}
          {liveStatusLabel(live.status)}
        </span>
        <span className="text-sm text-zinc-400">{formatLiveSchedule(live.scheduledAt)}</span>
      </div>

      <h1 className="mt-3 font-display text-xl font-semibold tracking-tight text-white text-balance sm:text-2xl">
        {live.title}
      </h1>
      {standalone ? (
        <p className="mt-1.5 text-sm text-zinc-400">BelKou</p>
      ) : (
        <p className="mt-1.5 text-sm text-zinc-400">{live.course.title}</p>
      )}
      <p className="mt-2 text-xs text-zinc-500">
        {free
          ? "Live gratuit · réservation requise"
          : standalone
            ? `${priceLabel} pour ce live · offert avec le VIP`
            : `${priceLabel} pour ce live · non inclus dans le cours · offert avec le VIP`}
      </p>
      {description ? (
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-400">{description}</p>
      ) : null}

      {watching ? null : !live.canWatch ? (
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
        <p className="mt-5 text-sm font-medium text-white/85">
          Place réservée — le live commence {formatLiveSchedule(live.scheduledAt)}.
        </p>
      ) : live.status === "ended" ? (
        <p className="mt-5 text-sm font-medium text-white/85">Replay en préparation.</p>
      ) : standalone ? null : (
        <Button asChild variant="secondary" className="mt-5 h-11 min-w-[10.5rem] rounded-full px-6">
          <Link to="/courses/$slug" params={{ slug: live.course.slug }}>
            Voir le cours
          </Link>
        </Button>
      )}
    </div>
  );
}
