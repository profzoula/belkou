import { LiveVideoCard } from "@/components/live/LiveVideoCard";
import type { PublicLiveListItem } from "@/lib/live";
import { cn } from "@/lib/utils";

export function LiveRelatedRail({
  sessions,
  currentId,
  reservedIds,
  title = "Autres lives",
  limit = 4,
  tone = "default",
}: {
  sessions: PublicLiveListItem[];
  currentId?: string;
  reservedIds?: Set<string>;
  title?: string;
  /** Rangée type Event1–Event4 sous le player. */
  limit?: number;
  /** Sous le stage sombre (watch) vs pages claires. */
  tone?: "default" | "onDark";
}) {
  const related = sessions
    .filter((session) => (currentId ? session.id !== currentId : true))
    .slice(0, limit);
  if (related.length === 0) return null;

  return (
    <section>
      <h2
        className={cn(
          "mb-4 text-sm font-semibold tracking-tight sm:text-base",
          tone === "onDark" ? "text-white" : "text-foreground",
        )}
      >
        {title}
      </h2>
      <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))] sm:gap-4">
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
