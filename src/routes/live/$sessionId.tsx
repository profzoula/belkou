import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Radio } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { LiveChat } from "@/components/live/LiveChat";
import { LiveStreamPlayer } from "@/components/live/LiveStreamPlayer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { formatLiveSchedule, liveStatusLabel, type PublicLiveSession } from "@/lib/live";
import { getPublicLiveSession } from "@/lib/fns/live";
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
  const [live, setLive] = useState<PublicLiveSession | null>(null);
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
    return () => {
      cancelled = true;
    };
  }, [authLoading, loadFn, session?.access_token, sessionId]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main id="main-content" className="site-container site-page-top pb-16 pt-6 sm:pt-10">
        {error ? (
          <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-8 text-center">
            <p className="font-semibold">{error}</p>
            <Button asChild className="mt-4 rounded-xl">
              <Link to="/live">Retour aux lives</Link>
            </Button>
          </div>
        ) : !live ? (
          <p className="py-16 text-center text-sm text-muted-foreground">Chargement du live…</p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.7fr)] lg:items-start">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                {live.courseTitle}
              </p>
              <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                {live.title}
              </h1>
              <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                  {live.status === "live" ? <Radio className="size-3.5 text-red-500" aria-hidden /> : null}
                  {liveStatusLabel(live.status)}
                </span>
                <span>· {formatLiveSchedule(live.scheduledAt)}</span>
              </p>
              {live.description ? (
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {live.description}
                </p>
              ) : null}

              <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-black">
                {live.status === "scheduled" ? (
                  <div className="flex aspect-video flex-col items-center justify-center gap-3 bg-muted px-6 text-center">
                    <p className="font-semibold text-foreground">Le live n&apos;a pas encore commencé</p>
                    <p className="text-sm text-muted-foreground">
                      Revenez à {formatLiveSchedule(live.scheduledAt)}.
                    </p>
                  </div>
                ) : live.canWatch && live.playbackUrl ? (
                  <LiveStreamPlayer
                    provider={live.provider}
                    url={live.playbackUrl}
                    title={live.title}
                    live={live.status === "live"}
                  />
                ) : (
                  <div className="flex aspect-video flex-col items-center justify-center gap-3 bg-muted px-6 text-center">
                    <p className="font-semibold text-foreground">Accès live</p>
                    <p className="max-w-md text-sm text-muted-foreground">
                      Déjà inscrit à ce cours ? Connectez-vous — le live est offert. Sinon,
                      l&apos;accès live est à ${live.liveTicketPrice.toFixed(2)}.
                    </p>
                    <div className="mt-2 flex flex-wrap justify-center gap-2">
                      {!session ? (
                        <Button asChild className="rounded-xl">
                          <Link to="/login" search={{ redirect: `/live/${sessionId}` }}>
                            Se connecter (déjà inscrit)
                          </Link>
                        </Button>
                      ) : null}
                      <Button asChild className="rounded-xl">
                        <Link
                          to="/checkout"
                          search={{ course: live.courseSlug, live: "1" }}
                        >
                          Accès live ${live.liveTicketPrice.toFixed(2)}
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="rounded-xl">
                        <Link to="/courses/$slug" params={{ slug: live.courseSlug }}>
                          Acheter le cours
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <LiveChat
              sessionId={live.id}
              canComment={live.canComment}
              live={live.status === "live"}
            />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
