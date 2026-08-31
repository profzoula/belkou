import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Radio } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { LiveChat } from "@/components/live/LiveChat";
import { LiveInfoCard } from "@/components/live/LiveInfoCard";
import { LiveStreamPlayer } from "@/components/live/LiveStreamPlayer";
import { LiveVideoCard } from "@/components/live/LiveVideoCard";
import { LiveWatchStage } from "@/components/live/LiveWatchStage";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/hooks/use-auth";
import {
  paidLiveSessions,
  pickFeaturedFreeLive,
  type PublicLiveListItem,
  type PublicLiveSession,
} from "@/lib/live";
import { getPublicLiveSession, listMyLiveSessions, listPublicLiveSessions } from "@/lib/fns/live";

const STATUS_POLL_MS = 20_000;

export type LiveIndexData = {
  sessions: PublicLiveListItem[];
  featuredFree: PublicLiveSession | null;
};

function LiveSection({
  title,
  sessions,
  reservedIds,
}: {
  title: string;
  sessions: PublicLiveListItem[];
  reservedIds: Set<string>;
}) {
  if (sessions.length === 0) return null;
  return (
    <section>
      <h2 className="font-display text-lg font-semibold tracking-tight sm:text-xl">{title}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sessions.map((session) => (
          <LiveVideoCard
            key={session.id}
            session={session}
            reserved={reservedIds.has(session.id)}
          />
        ))}
      </div>
    </section>
  );
}

export function LiveIndexPage({ initial }: { initial: LiveIndexData }) {
  const { session } = useAuth();
  const myLivesFn = useServerFn(listMyLiveSessions);
  const listFn = useServerFn(listPublicLiveSessions);
  const loadFn = useServerFn(getPublicLiveSession);
  const [sessions, setSessions] = useState(initial.sessions);
  const [featuredFree, setFeaturedFree] = useState(initial.featuredFree);
  const [reservedIds, setReservedIds] = useState<Set<string>>(new Set());

  const accessToken = session?.access_token;

  useEffect(() => {
    if (!accessToken) {
      setReservedIds(new Set());
      return;
    }
    let cancelled = false;
    myLivesFn({ data: { accessToken } })
      .then((result) => {
        if (!cancelled) setReservedIds(new Set(result.sessions.map((item) => item.id)));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [accessToken, myLivesFn]);

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      try {
        const next = await listFn();
        if (cancelled) return;
        setSessions(next);
        const featured = pickFeaturedFreeLive(next);
        if (!featured) {
          setFeaturedFree(null);
          return;
        }
        const full = await loadFn({ data: { sessionId: featured.id, accessToken } });
        if (!cancelled) setFeaturedFree(full);
      } catch {
        /* keep last good stage */
      }
    };
    void refresh();
    const interval = window.setInterval(() => void refresh(), STATUS_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [accessToken, listFn, loadFn]);

  const paid = paidLiveSessions(sessions);
  const liveNow = paid.filter((item) => item.status === "live");
  const upcoming = paid.filter((item) => item.status === "scheduled");
  const replays = paid.filter((item) => item.status === "ended");
  const showFreeStage = Boolean(featuredFree?.canWatch && featuredFree.playbackUrl);
  const hasPaid = paid.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main id="main-content">
        {showFreeStage && featuredFree ? (
          <div className="bg-zinc-950 pt-[var(--site-header-height)]">
            <LiveWatchStage
              player={
                <LiveStreamPlayer
                  provider={featuredFree.provider}
                  url={featuredFree.playbackUrl!}
                  title={featuredFree.title}
                  live={featuredFree.status === "live"}
                  fill
                />
              }
              caption={<LiveInfoCard live={featuredFree} />}
              chat={
                <LiveChat
                  sessionId={featuredFree.id}
                  canWatch={featuredFree.canWatch}
                  canComment={featuredFree.canComment}
                  live={featuredFree.status === "live"}
                  loggedIn={Boolean(session)}
                />
              }
            />
          </div>
        ) : null}

        <div className="site-container space-y-10 pb-16 pt-4 sm:pt-6">
          {showFreeStage ? null : (
            <header className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="section-label mb-2">BelKou</p>
                <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                  Live
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                  Directs, questions en live, puis replay — le tout sur BelKou. Les lives gratuits
                  s&apos;ouvrent sans compte ; les lives payants demandent une place ou le VIP.
                </p>
              </div>
              {liveNow.length > 0 ? (
                <p className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">
                  <Radio className="size-3.5" aria-hidden />
                  {liveNow.length} en direct
                </p>
              ) : null}
            </header>
          )}

          {hasPaid ? (
            <div className={showFreeStage ? "space-y-10 pt-6" : "space-y-10"}>
              {showFreeStage ? (
                <h2 className="font-display text-lg font-semibold tracking-tight sm:text-xl">
                  Lives payants
                </h2>
              ) : null}
              <LiveSection title="En direct" sessions={liveNow} reservedIds={reservedIds} />
              <LiveSection title="À venir" sessions={upcoming} reservedIds={reservedIds} />
              <LiveSection title="Replays" sessions={replays} reservedIds={reservedIds} />
            </div>
          ) : showFreeStage ? null : (
            <EmptyState
              icon={Radio}
              title="Aucun live pour le moment"
              description="Revenez bientôt — les sessions en direct et les replays apparaissent ici."
              action={
                <Button asChild className="rounded-xl">
                  <Link to="/courses">Voir les cours</Link>
                </Button>
              }
              className="rounded-2xl border border-dashed border-border bg-muted/20"
            />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
