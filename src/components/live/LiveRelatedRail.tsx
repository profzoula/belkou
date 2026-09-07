import { LiveVideoCard } from "@/components/live/LiveVideoCard";
import type { PublicLiveListItem } from "@/lib/live";

export function LiveRelatedRail({
  sessions,
  currentId,
  reservedIds,
  title = "Autres lives",
  limit = 4,
}: {
  sessions: PublicLiveListItem[];
  currentId?: string;
  reservedIds?: Set<string>;
  title?: string;
  /** Rangée type Event1–Event4 sous le player. */
  limit?: number;
}) {
  const related = sessions
    .filter((session) => (currentId ? session.id !== currentId : true))
    .slice(0, limit);
  if (related.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 text-sm font-semibold tracking-tight text-foreground sm:text-base">
        {title}
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {related.map((session) => (
          <LiveVideoCard
            key={session.id}
            session={session}
            reserved={reservedIds?.has(session.id)}
          />
        ))}
      </div>
    </section>
  );
}
