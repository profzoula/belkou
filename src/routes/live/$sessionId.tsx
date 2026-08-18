import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { LiveChat } from "@/components/live/LiveChat";
import { LiveEventPoster } from "@/components/live/LiveEventPoster";
import { LiveInfoCard } from "@/components/live/LiveInfoCard";
import { LiveRelatedRail } from "@/components/live/LiveRelatedRail";
import { LiveStreamPlayer } from "@/components/live/LiveStreamPlayer";
import { LiveWatchStage } from "@/components/live/LiveWatchStage";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/hooks/use-auth";
import { liveStatusLabel, type PublicLiveListItem, type PublicLiveSession } from "@/lib/live";
import { getPublicLiveSession, listPublicLiveSessions } from "@/lib/fns/live";
import { seoHead } from "@/lib/seo";
import { getWhatsAppChatUrl } from "@/lib/site-config";

/** How often a page left open re-checks whether the stream opened or closed. */
const STATUS_POLL_MS = 20_000;

export const Route = createFileRoute("/live/$sessionId")({
  head: ({ loaderData }) => {
    const live = loaderData as PublicLiveSession | null | undefined;
    if (!live) {
      return seoHead({
        title: "Live — BelKou",
        description: "Session live BelKou : suivez le direct et commentez avec les étudiants.",
        path: "/live",
      });
    }
    return seoHead({
      title: `${live.title} — Live BelKou`,
      description:
        live.description.trim() ||
        live.course.description.trim() ||
        "Session live BelKou : suivez le direct et commentez avec les étudiants.",
      path: `/live/${live.id}`,
      ...(live.thumbnailUrl ? { ogImage: live.thumbnailUrl } : {}),
    });
  },
  // Anonymous fetch so the event is server-rendered, shareable and indexable;
  // the client then refetches with the token to unlock playback.
  loader: async ({ params }) => {
    try {
      return await getPublicLiveSession({ data: { sessionId: params.sessionId } });
    } catch {
      return null;
    }
  },
  component: LiveSessionPage,
});

function LiveStageSkeleton() {
  return (
    <div className="pt-[var(--site-header-height)]">
      <div className="grid bg-zinc-950 lg:grid-cols-[minmax(0,1fr)_22.5rem]">
        <div>
          <div className="aspect-video max-h-[calc(100dvh-var(--site-header-height)-7rem)] w-full animate-pulse bg-zinc-900" />
          <div className="space-y-3 px-4 py-4 sm:px-5">
            <div className="h-5 w-24 animate-pulse rounded bg-zinc-900" />
            <div className="h-6 w-2/3 animate-pulse rounded bg-zinc-900" />
            <div className="h-4 w-40 animate-pulse rounded bg-zinc-900" />
          </div>
        </div>
        <div className="hidden min-h-[24rem] space-y-4 border-l border-zinc-800 bg-zinc-950 p-4 lg:block">
          <div className="h-4 w-28 animate-pulse rounded bg-zinc-900" />
          <div className="h-4 w-full animate-pulse rounded bg-zinc-900" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-zinc-900" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-900" />
        </div>
      </div>
      <span className="sr-only" role="status">
        Chargement du live…
      </span>
    </div>
  );
}

function LiveSessionPage() {
  const { sessionId } = Route.useParams();
  const initial = Route.useLoaderData() as PublicLiveSession | null;
  const { session, loading: authLoading } = useAuth();
  const loadFn = useServerFn(getPublicLiveSession);
  const listFn = useServerFn(listPublicLiveSessions);
  const [live, setLive] = useState<PublicLiveSession | null>(initial);
  const [related, setRelated] = useState<PublicLiveListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const liveRef = useRef<PublicLiveSession | null>(initial);

  const accessToken = session?.access_token;
  const status = live?.status;

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;

    const load = async () => {
      try {
        const result = await loadFn({ data: { sessionId, accessToken } });
        if (cancelled) return;
        liveRef.current = result;
        setLive(result);
        setError(null);
      } catch (caught) {
        // A failed poll must not wipe a session already on screen.
        if (cancelled || liveRef.current) return;
        setError(caught instanceof Error ? caught.message : "Live introuvable.");
      }
    };

    void load();
    // A scheduled event must open by itself: nobody should have to guess and reload.
    const shouldPoll = !status || status === "scheduled" || status === "live";
    const interval = shouldPoll ? window.setInterval(() => void load(), STATUS_POLL_MS) : null;

    return () => {
      cancelled = true;
      if (interval) window.clearInterval(interval);
    };
  }, [authLoading, loadFn, accessToken, sessionId, status]);

  useEffect(() => {
    let cancelled = false;
    listFn()
      .then((sessions) => {
        if (!cancelled) setRelated(sessions);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [listFn]);

  const showPlayer = Boolean(
    live &&
    live.canWatch &&
    live.playbackUrl &&
    (live.status === "live" || live.status === "ended"),
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main id="main-content">
        {!live && error ? (
          <div className="site-container site-page-top pb-16">
            <EmptyState
              title="Ce live n'est plus disponible"
              description={`${error} Vérifiez le lien, ou retrouvez toutes les sessions sur la page Live.`}
              action={
                <Button asChild className="rounded-xl">
                  <Link to="/live">Retour aux lives</Link>
                </Button>
              }
              className="rounded-2xl border border-border bg-card"
            />
          </div>
        ) : !live ? (
          <LiveStageSkeleton />
        ) : live.status === "canceled" ? (
          <div className="site-container site-page-top pb-16">
            <EmptyState
              title={`${liveStatusLabel(live.status)} — ${live.title}`}
              description="Cette session a été annulée. Si vous aviez réservé votre place, écrivez-nous : nous vous replaçons sur une prochaine date ou nous vous remboursons."
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Button asChild className="rounded-xl">
                    <Link to="/live">Voir les autres lives</Link>
                  </Button>
                  <Button asChild variant="secondary" className="rounded-xl">
                    <a href={getWhatsAppChatUrl()} target="_blank" rel="noreferrer">
                      Nous contacter
                    </a>
                  </Button>
                </div>
              }
              className="rounded-2xl border border-border bg-card"
            />
          </div>
        ) : (
          <>
            <div className="bg-zinc-950 pt-[var(--site-header-height)]">
              <LiveWatchStage
                player={
                  showPlayer ? (
                    <LiveStreamPlayer
                      provider={live.provider}
                      url={live.playbackUrl!}
                      title={live.title}
                      live={live.status === "live"}
                      fill
                    />
                  ) : (
                    <LiveEventPoster live={live} />
                  )
                }
                caption={
                  <LiveInfoCard live={live} loggedIn={Boolean(session)} watching={showPlayer} />
                }
                chat={
                  <LiveChat
                    sessionId={live.id}
                    canComment={live.canComment}
                    live={live.status === "live"}
                    loggedIn={Boolean(session)}
                  />
                }
              />
            </div>
            <div className="site-container space-y-4 py-8 pb-16">
              <LiveRelatedRail sessions={related} currentId={live.id} />
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
