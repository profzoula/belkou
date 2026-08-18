import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { CheckoutPage } from "@/components/checkout/CheckoutPage";
import { getPublicCourse } from "@/lib/fns/courses";
import { getPublicLiveSession } from "@/lib/fns/live";
import { seoHead } from "@/lib/seo";

const searchSchema = z.object({
  plan: z.enum(["premium", "vip", "live"]).optional(),
  course: z.string().optional(),
  /** Legacy links use `?live=1`, which the router parses as a number. */
  live: z.coerce.string().optional(),
  /** Live tickets are sold per event. */
  session: z.string().optional(),
  ref: z.string().optional(),
});

export const Route = createFileRoute("/checkout")({
  head: () =>
    seoHead({
      title: "Checkout — BelKou",
      description: "Finalisez votre inscription à la formation BelKou.",
      path: "/checkout",
      noindex: true,
    }),
  validateSearch: searchSchema,
  loader: async ({ location }) => {
    const params = new URLSearchParams(location.search);
    const sessionId = params.get("session")?.trim();
    if (sessionId) {
      const found = await getPublicLiveSession({ data: { sessionId } }).catch(() => null);
      // A canceled event still resolves, but no seat may be sold for it.
      return { course: null, live: found?.status === "canceled" ? null : found };
    }
    const courseSlug = params.get("course") ?? undefined;
    if (!courseSlug) return { course: null, live: null };
    const course = await getPublicCourse({ data: { slug: courseSlug } });
    return { course, live: null };
  },
  component: CheckoutRoute,
});

function CheckoutRoute() {
  const { plan, course, live, session, ref } = Route.useSearch();
  const { course: initialCourse, live: liveSession } = Route.useLoaderData();
  return (
    <CheckoutPage
      plan={plan === "live" ? undefined : plan}
      courseSlug={course}
      liveTicket={live === "1" || plan === "live"}
      liveSessionId={liveSession ? session : undefined}
      liveSessionTitle={liveSession?.title}
      liveSessionScheduledAt={liveSession?.scheduledAt}
      liveSessionPrice={liveSession?.liveTicketPrice}
      refCode={ref}
      initialCourse={initialCourse}
    />
  );
}
