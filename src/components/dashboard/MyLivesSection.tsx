import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, CalendarPlus, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { useLiveCountdown } from "@/hooks/use-live-countdown";
import { listMyLiveSessions } from "@/lib/fns/live";
import { formatLiveSchedule, type PublicLiveListItem } from "@/lib/live";
import { downloadIcs } from "@/lib/live-calendar";
import { absoluteUrl } from "@/lib/seo";

type MyLivesSectionProps = {
  accessToken: string;
};

function LiveRow({ session }: { session: PublicLiveListItem }) {
  const countdown = useLiveCountdown(session.scheduledAt, session.status === "scheduled");
  const isLive = session.status === "live";

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={isLive ? "destructive" : session.status === "ended" ? "secondary" : "success"}
          >
            {isLive ? "En direct" : session.status === "ended" ? "Replay" : "Réservé"}
          </Badge>
          <p className="truncate font-semibold text-foreground">{session.title}</p>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {formatLiveSchedule(session.scheduledAt)}
          {countdown ? ` · ${countdown}` : null}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {session.status === "scheduled" ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() =>
              downloadIcs({
                id: session.id,
                title: session.title,
                description: session.description || session.course.description,
                url: absoluteUrl(`/live/${session.id}`),
                startIso: session.scheduledAt,
              })
            }
          >
            <CalendarPlus className="h-3.5 w-3.5" />
            Calendrier
          </Button>
        ) : null}
        <Button asChild size="sm" variant={isLive ? "default" : "secondary"} className="h-9">
          <Link to="/live/$sessionId" params={{ sessionId: session.id }}>
            {isLive ? "Rejoindre" : session.status === "ended" ? "Replay" : "Voir"}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </li>
  );
}

/** The seat a student paid for has to live somewhere they can find it again. */
export function MyLivesSection({ accessToken }: MyLivesSectionProps) {
  const myLivesFn = useServerFn(listMyLiveSessions);
  const [sessions, setSessions] = useState<PublicLiveListItem[] | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    myLivesFn({ data: { accessToken } })
      .then((result) => {
        if (!cancelled) setSessions(result.sessions);
      })
      .catch(() => {
        if (!cancelled) setSessions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, myLivesFn]);

  if (!sessions || sessions.length === 0) return null;

  const upcoming = sessions
    .filter((session) => session.status !== "ended")
    .sort((a, b) => Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt));
  const replays = sessions
    .filter((session) => session.status === "ended")
    .sort((a, b) => Date.parse(b.scheduledAt) - Date.parse(a.scheduledAt))
    .slice(0, 3);

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-foreground">Mes lives</h2>
          <p className="mt-1 text-sm text-muted-foreground">Vos places réservées et vos replays.</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/live">Tous les lives</Link>
        </Button>
      </div>

      {upcoming.length > 0 ? (
        <ul className="space-y-3">
          {upcoming.map((session) => (
            <LiveRow key={session.id} session={session} />
          ))}
        </ul>
      ) : (
        <Panel
          variant="dashed"
          padding="sm"
          className="flex items-center gap-3 text-sm text-muted-foreground"
        >
          <Radio className="h-4 w-4 shrink-0 text-primary" />
          Aucune session à venir — vos replays restent disponibles ci-dessous.
        </Panel>
      )}

      {replays.length > 0 ? (
        <ul className="space-y-3">
          {replays.map((session) => (
            <LiveRow key={session.id} session={session} />
          ))}
        </ul>
      ) : null}
    </section>
  );
}
