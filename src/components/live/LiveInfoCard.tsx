import { Link } from "@tanstack/react-router";
import { Radio, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  formatLiveSchedule,
  isStandaloneLiveSlug,
  liveReservedLabel,
  liveStatusLabel,
  type PublicLiveSession,
} from "@/lib/live";
import { absoluteUrl } from "@/lib/seo";
import { shareLink } from "@/lib/share";
import { cn } from "@/lib/utils";

/**
 * The line under the player. It only ever shows to someone already watching,
 * so it carries context — not a sales pitch.
 */
export function LiveInfoCard({ live }: { live: PublicLiveSession }) {
  const standalone = isStandaloneLiveSlug(live.course.slug);
  const description = live.description.trim() || live.course.description.trim();
  const isLive = live.status === "live";
  const seats = liveReservedLabel(live.reservedCount);

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
        {seats ? <span className="text-sm text-zinc-500">· {seats}</span> : null}
      </div>

      <h1 className="mt-3 font-display text-xl font-semibold tracking-tight text-white text-balance sm:text-2xl">
        {live.title}
      </h1>
      <p className="mt-1.5 text-sm text-zinc-400">{standalone ? "BelKou" : live.course.title}</p>
      {description ? (
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-400">{description}</p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          className="h-9 rounded-full px-4 text-xs"
          onClick={() =>
            void shareLink({
              title: live.title,
              text: "Live BelKou",
              url: absoluteUrl(`/live/${live.id}`),
            })
          }
        >
          <Share2 className="size-4" aria-hidden />
          Partager
        </Button>
        {standalone ? null : (
          <Button asChild variant="secondary" className="h-9 rounded-full px-4 text-xs">
            <Link to="/courses/$slug" params={{ slug: live.course.slug }}>
              Voir le cours
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
