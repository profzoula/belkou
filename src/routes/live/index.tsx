import { createFileRoute } from "@tanstack/react-router";
import { LiveIndexPage, type LiveIndexData } from "@/components/live/LiveIndexPage";
import { pickFeaturedFreeLive } from "@/lib/live";
import { getPublicLiveSession, listPublicLiveSessions } from "@/lib/fns/live";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/live/")({
  head: () =>
    seoHead({
      title: "Live — BelKou",
      description:
        "Lives BelKou : rejoignez une session en direct, commentez avec les autres étudiants, puis revoyez l'enregistrement.",
      path: "/live",
    }),
  loader: async (): Promise<LiveIndexData> => {
    try {
      const sessions = await listPublicLiveSessions();
      const featured = pickFeaturedFreeLive(sessions);
      if (!featured) return { sessions, featuredFree: null };
      try {
        const featuredFree = await getPublicLiveSession({ data: { sessionId: featured.id } });
        return { sessions, featuredFree };
      } catch {
        return { sessions, featuredFree: null };
      }
    } catch {
      return { sessions: [], featuredFree: null };
    }
  },
  component: LiveIndexRoute,
});

function LiveIndexRoute() {
  const initial = Route.useLoaderData() as LiveIndexData;
  return <LiveIndexPage initial={initial} />;
}
