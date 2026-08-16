import { Link } from "@tanstack/react-router";
import { Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  LIVE_TICKET_PRICE_USD,
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
        {standalone
          ? `Offert avec le VIP · sinon ${LIVE_TICKET_PRICE_USD.toFixed(2).replace(".", ",")} $`
          : `Offert avec le cours ou le VIP · sinon ${LIVE_TICKET_PRICE_USD.toFixed(2).replace(".", ",")} $`}
      </p>
      {description ? (
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-400">{description}</p>
      ) : null}

      {watching ? null : !live.canWatch ? (
        <Button asChild className="mt-5 h-11 min-w-[10.5rem] rounded-full px-6">
          {loggedIn ? (
            <Link
              to="/checkout"
              search={standalone ? { live: "1" } : { course: live.course.slug, live: "1" }}
            >
              Rejoindre le live
            </Link>
          ) : (
            <Link to="/login" search={{ redirect: `/live/${live.id}` }}>
              Rejoindre le live
            </Link>
          )}
        </Button>
      ) : live.status === "scheduled" ? (
        <p className="mt-5 text-sm font-medium text-white/85">
          Vous avez accès — le live commence {formatLiveSchedule(live.scheduledAt)}.
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
