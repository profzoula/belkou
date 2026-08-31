import { LiveVideoCard } from "@/components/live/LiveVideoCard";
import type { PublicLiveListItem } from "@/lib/live";

export function LiveRelatedRail({
  sessions,
  currentId,
}: {
  sessions: PublicLiveListItem[];
  currentId: string;
}) {
  const related = sessions
    .filter((session) => session.id !== currentId && session.ticketPrice > 0)
    .slice(0, 6);
  if (related.length === 0) return null;

  return (
    <section>
      <h2 className="font-display text-lg font-semibold tracking-tight">Autres lives</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {related.map((session) => (
          <LiveVideoCard key={session.id} session={session} />
        ))}
      </div>
    </section>
  );
}
