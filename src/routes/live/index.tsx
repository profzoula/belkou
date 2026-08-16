import { createFileRoute, Link } from "@tanstack/react-router";
import { Radio } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { LiveVideoCard } from "@/components/live/LiveVideoCard";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { PublicLiveListItem } from "@/lib/live";
import { listPublicLiveSessions } from "@/lib/fns/live";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/live/")({
  head: () =>
    seoHead({
      title: "Live — BelKou",
      description:
        "Lives BelKou : rejoignez une session en direct, commentez avec les autres étudiants, puis revoyez l'enregistrement.",
      path: "/live",
    }),
  loader: () => listPublicLiveSessions(),
  component: LiveIndexPage,
});

function LiveSection({
  title,
  sessions,
}: {
  title: string;
  sessions: PublicLiveListItem[];
}) {
  if (sessions.length === 0) return null;
  return (
    <section>
      <h2 className="font-display text-lg font-semibold tracking-tight sm:text-xl">{title}</h2>
      <div className="mt-4 grid gap-x-4 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
        {sessions.map((session) => (
          <LiveVideoCard key={session.id} session={session} />
        ))}
      </div>
    </section>
  );
}

function LiveIndexPage() {
  const sessions = Route.useLoaderData() as PublicLiveListItem[];
  const liveNow = sessions.filter((session) => session.status === "live");
  const upcoming = sessions.filter((session) => session.status === "scheduled");
  const replays = sessions.filter((session) => session.status === "ended");
  const featured = liveNow[0] ?? upcoming[0] ?? null;
  const moreLive = liveNow.filter((session) => session.id !== featured?.id);
  const moreUpcoming = upcoming.filter((session) => session.id !== featured?.id);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main id="main-content">
        <div className="site-container site-page-top space-y-10 pb-16 pt-4 sm:pt-6">
          <header className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="section-label mb-2">BelKou</p>
              <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Live</h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                Directs, questions en live, puis replay — le tout sur BelKou.
              </p>
            </div>
            {liveNow.length > 0 ? (
              <p className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">
                <Radio className="size-3.5" aria-hidden />
                {liveNow.length} en direct
              </p>
            ) : null}
          </header>

          {featured ? (
            <div className="space-y-10">
              <div className="max-w-3xl xl:max-w-4xl">
                <LiveVideoCard session={featured} featured />
              </div>
              <LiveSection title="Aussi en direct" sessions={moreLive} />
              <LiveSection
                title={featured.status === "live" ? "À venir" : "Autres sessions"}
                sessions={moreUpcoming}
              />
              <LiveSection title="Replays" sessions={replays} />
            </div>
          ) : (
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
