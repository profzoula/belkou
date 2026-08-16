import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
import type { PublicLiveListItem, PublicLiveSession } from "@/lib/live";
import { getPublicLiveSession, listPublicLiveSessions } from "@/lib/fns/live";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/live/$sessionId")({
  head: () =>
    seoHead({
      title: "Live — BelKou",
      description: "Session live BelKou : suivez le direct et commentez avec les étudiants.",
      path: "/live",
    }),
  component: LiveSessionPage,
});

function LiveSessionPage() {
  const { sessionId } = Route.useParams();
  const { session, loading: authLoading } = useAuth();
  const loadFn = useServerFn(getPublicLiveSession);
  const listFn = useServerFn(listPublicLiveSessions);
  const [live, setLive] = useState<PublicLiveSession | null>(null);
  const [related, setRelated] = useState<PublicLiveListItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    loadFn({ data: { sessionId, accessToken: session?.access_token } })
      .then((result) => {
        if (!cancelled) setLive(result);
      })
      .catch((caught) => {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "Live introuvable");
        }
      });
    listFn()
      .then((sessions) => {
        if (!cancelled) setRelated(sessions);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [authLoading, listFn, loadFn, session?.access_token, sessionId]);

  const showPlayer = Boolean(
    live && live.canWatch && live.playbackUrl && (live.status === "live" || live.status === "ended"),
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main id="main-content">
        {error ? (
          <div className="site-container site-page-top pb-16">
            <EmptyState
              title={error}
              description="Cette session n'est plus disponible, ou le lien est incorrect."
              action={
                <Button asChild className="rounded-xl">
                  <Link to="/live">Retour aux lives</Link>
                </Button>
              }
              className="rounded-2xl border border-border bg-card"
            />
          </div>
        ) : !live ? (
          <div className="pt-[var(--site-header-height)]">
            <div className="grid bg-zinc-950 lg:grid-cols-[minmax(0,1fr)_22.5rem]">
              <div className="aspect-video max-h-[calc(100dvh-var(--site-header-height)-7rem)] w-full animate-pulse bg-zinc-900" />
              <div className="hidden h-auto min-h-[24rem] border-l border-zinc-800 bg-zinc-950 lg:block" />
            </div>
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
                  <LiveInfoCard
                    live={live}
                    loggedIn={Boolean(session)}
                    watching={showPlayer}
                  />
                }
                chat={
                  <LiveChat
                    sessionId={live.id}
                    canComment={live.canComment}
                    live={live.status === "live"}
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
