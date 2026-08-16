import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { LiveVideoCard } from "@/components/live/LiveVideoCard";
import { Button } from "@/components/ui/button";
import type { PublicLiveListItem } from "@/lib/live";
import { listPublicLiveSessions } from "@/lib/fns/live";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/live/")({
  head: () =>
    seoHead({
      title: "Live — BelKou",
      description:
        "Cours en direct BelKou : rejoignez une session live, commentez avec les autres étudiants, puis revoyez l'enregistrement.",
      path: "/live",
    }),
  loader: () => listPublicLiveSessions(),
  component: LiveIndexPage,
});

function LiveIndexPage() {
  const sessions = Route.useLoaderData() as PublicLiveListItem[];
  const liveNow = sessions.filter((session) => session.status === "live");
  const featured = liveNow[0] ?? sessions.find((session) => session.status === "scheduled") ?? null;
  const rest = sessions.filter((session) => session.id !== featured?.id);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main id="main-content">
        <div className="site-container site-page-top space-y-8 pb-14 pt-4 sm:pt-6">
          {featured ? (
            <div className="max-w-3xl">
              <LiveVideoCard session={featured} />
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border px-4 py-16 text-center">
              <p className="font-display text-2xl font-semibold">Aucun live pour le moment</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Revenez bientôt — les sessions apparaissent ici avec le cours associé.
              </p>
              <Button asChild className="mt-5 rounded-xl">
                <Link to="/courses">Voir les cours</Link>
              </Button>
            </div>
          )}

          {rest.length > 0 ? (
            <section>
              <h2 className="font-display text-lg font-semibold">
                {featured?.status === "live" ? "À venir et replays" : "Autres sessions"}
              </h2>
              <div className="mt-4 grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((session) => (
                  <LiveVideoCard key={session.id} session={session} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
}
