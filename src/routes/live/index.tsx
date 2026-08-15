import { createFileRoute, Link } from "@tanstack/react-router";
import { Radio } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FadeIn } from "@/components/motion/FadeIn";
import { Button } from "@/components/ui/button";
import { formatLiveSchedule, liveStatusLabel, type LiveStatus, type PublicLiveListItem } from "@/lib/live";
import { listPublicLiveSessions } from "@/lib/fns/live";
import { seoHead } from "@/lib/seo";
import { cn } from "@/lib/utils";

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

function statusClass(status: LiveStatus) {
  if (status === "live") return "bg-red-500 text-white";
  if (status === "ended") return "bg-success/15 text-success";
  return "bg-primary/10 text-primary";
}

function LiveIndexPage() {
  const sessions = Route.useLoaderData() as PublicLiveListItem[];
  const liveNow = sessions.filter((session) => session.status === "live");
  const upcoming = sessions.filter((session) => session.status === "scheduled");
  const replays = sessions.filter((session) => session.status === "ended");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main id="main-content">
        <section className="relative overflow-hidden border-b border-border bg-gradient-mesh">
          <div className="site-container site-page-top mx-auto max-w-3xl pb-10 pt-8 text-center sm:pb-14 sm:pt-12">
            <FadeIn>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Live</p>
              <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Cours en direct
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground md:text-lg">
                Inscrit au cours ? Le live est offert. Nouveau ? Accès live à 9,99 $ — regarder et
                commenter sur BelKou.
              </p>
            </FadeIn>
          </div>
        </section>

        <div className="site-container space-y-10 py-10 sm:py-14">
          {liveNow.length > 0 ? (
            <section>
              <h2 className="font-display text-xl font-semibold">En cours</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {liveNow.map((session) => (
                  <LiveCard key={session.id} session={session} featured />
                ))}
              </div>
            </section>
          ) : null}

          <section>
            <h2 className="font-display text-xl font-semibold">À venir</h2>
            {upcoming.length === 0 ? (
              <p className="mt-4 rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                Aucun live programmé pour le moment. Revenez bientôt.
              </p>
            ) : (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {upcoming.map((session) => (
                  <LiveCard key={session.id} session={session} />
                ))}
              </div>
            )}
          </section>

          {replays.length > 0 ? (
            <section>
              <h2 className="font-display text-xl font-semibold">Replays</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {replays.map((session) => (
                  <LiveCard key={session.id} session={session} />
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

function LiveCard({
  session,
  featured = false,
}: {
  session: PublicLiveListItem;
  featured?: boolean;
}) {
  return (
    <article
      className={cn(
        "flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm",
        featured && "border-red-500/40 ring-1 ring-red-500/20",
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
            statusClass(session.status),
          )}
        >
          {session.status === "live" ? <Radio className="size-3 animate-pulse" aria-hidden /> : null}
          {liveStatusLabel(session.status)}
        </span>
        <span className="text-xs text-muted-foreground">{formatLiveSchedule(session.scheduledAt)}</span>
      </div>
      <h3 className="mt-3 font-display text-lg font-semibold text-foreground">{session.title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{session.courseTitle}</p>
      <p className="mt-1 text-xs text-muted-foreground">Offert si vous avez le cours · sinon 9,99 $</p>
      {session.description ? (
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{session.description}</p>
      ) : null}
      <div className="mt-4">
        <Button asChild className="rounded-xl">
          <Link to="/live/$sessionId" params={{ sessionId: session.id }}>
            {session.status === "live"
              ? "Rejoindre le live"
              : session.status === "ended"
                ? "Voir le replay"
                : "Voir les détails"}
          </Link>
        </Button>
      </div>
    </article>
  );
}
