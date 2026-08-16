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
import { useAuth } from "@/hooks/use-auth";
import type { PublicLiveListItem, PublicLiveSession } from "@/lib/live";
import { getPublicLiveSession, listPublicLiveSessions } from "@/lib/fns/live";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/live/$sessionId")({
  head: () =>
    seoHead({
      title: "Live — BelKou",
      description: "Session live BelKou : suivez le cours en direct et commentez avec les étudiants.",
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
            <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-8 text-center">
              <p className="font-semibold">{error}</p>
              <Button asChild className="mt-4 rounded-xl">
                <Link to="/live">Retour aux lives</Link>
              </Button>
            </div>
          </div>
        ) : !live ? (
          <p className="site-container site-page-top py-16 text-center text-sm text-muted-foreground">
            Chargement du live…
          </p>
        ) : (
          <>
            <div className="pt-[var(--site-header-height)]">
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
            <div className="site-container grid gap-8 py-6 pb-16 lg:grid-cols-[minmax(0,1fr)_22.5rem] lg:items-start">
              {live.description || live.course.description ? (
                <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
                  {live.description || live.course.description}
                </p>
              ) : (
                <div />
              )}
              <LiveRelatedRail sessions={related} currentId={live.id} />
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
