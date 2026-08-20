import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/site/SectionHeader";
import { LiveVideoCard } from "@/components/live/LiveVideoCard";
import type { PublicLiveListItem } from "@/lib/live";

const MAX_VISIBLE = 3;

type LiveEventsSectionProps = {
  sessions: PublicLiveListItem[];
};

function byScheduledAsc(a: PublicLiveListItem, b: PublicLiveListItem) {
  return Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt);
}

export function LiveEventsSection({ sessions }: LiveEventsSectionProps) {
  const liveNow = sessions.filter((session) => session.status === "live");
  // Sessions arrive newest-first, which would put the most distant date at the top of a
  // teaser that only shows three. The next one to sell is the one closest to starting.
  const upcoming = sessions
    .filter((session) => session.status === "scheduled")
    .sort(byScheduledAsc);
  const replays = sessions.filter((session) => session.status === "ended");

  const featured = [...liveNow, ...upcoming, ...replays].slice(0, MAX_VISIBLE);
  if (featured.length === 0) return null;

  const heading =
    liveNow.length > 0
      ? {
          label: "En direct",
          title: "Un live est en cours",
          description:
            "Rejoignez la session maintenant : posez vos questions dans le chat et revoyez l'enregistrement quand vous voulez.",
        }
      : upcoming.length > 0
        ? {
            label: "Live",
            title: "Prochains lives",
            description:
              "Chaque live a son prix et sa place réservée. Inscrivez-vous dès l'annonce, bien avant le début — le replay reste à vous.",
          }
        : {
            label: "Live",
            title: "Replays des lives",
            description:
              "Vous avez manqué le direct ? Les enregistrements restent disponibles, avec les questions des autres étudiants.",
          };

  return (
    <section id="lives" className="site-section-anchor bg-gradient-mesh py-16 sm:py-20 md:py-24">
      <div className="site-container">
        <SectionHeader
          label={heading.label}
          title={heading.title}
          description={heading.description}
          align="left"
          className="mb-8 max-w-2xl"
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((session) => (
            <LiveVideoCard key={session.id} session={session} />
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <Button asChild variant="outline" className="touch-target rounded-full">
            <Link to="/live">
              Voir tous les lives
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
