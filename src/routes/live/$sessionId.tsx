import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { LiveChat } from "@/components/live/LiveChat";
import { LiveEventPage } from "@/components/live/LiveEventPage";
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

/** Mirrors the event page, the layout most visitors land on. */
function LiveStageSkeleton() {
  return (
    <div className="pt-[var(--site-header-height)]">
      <div className="aspect-[16/6] max-h-72 w-full animate-pulse bg-muted" />
      <div className="site-container pb-16">
        <div className="flex gap-4 border-b border-border py-5">
          <div className="hidden size-14 shrink-0 animate-pulse rounded-xl bg-muted sm:block" />
          <div className="w-full space-y-2">
            <div className="h-4 w-44 animate-pulse rounded bg-muted" />
            <div className="h-7 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-4 w-40 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
          <div className="h-64 animate-pulse rounded-2xl bg-muted" />
          <div className="h-44 animate-pulse rounded-2xl bg-muted" />
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
              description="Cette session a été annulée. Si vous aviez réservé votre place, écrivez-nous : nous créditons le montant payé sur n'importe quel autre cours ou live. Conformément à nos CGV, aucun remboursement n'est effectué."
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
        ) : showPlayer ? (
          <>
            <div className="bg-zinc-950 pt-[var(--site-header-height)]">
              <LiveWatchStage
                player={
                  <LiveStreamPlayer
                    provider={live.provider}
                    url={live.playbackUrl!}
                    title={live.title}
                    live={live.status === "live"}
                    fill
                  />
                }
                caption={<LiveInfoCard live={live} />}
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
        ) : (
          // No seat, or nothing to play yet: the event page sells the session instead.
          <>
            <LiveEventPage live={live} loggedIn={Boolean(session)} />
            <div className="site-container space-y-4 pb-16">
              <LiveRelatedRail sessions={related} currentId={live.id} />
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
