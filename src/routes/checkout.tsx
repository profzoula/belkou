import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { CheckoutPage } from "@/components/checkout/CheckoutPage";
import { getPublicCourse } from "@/lib/fns/courses";
import { seoHead } from "@/lib/seo";

const searchSchema = z.object({
  plan: z.enum(["premium", "vip"]).optional(),
  course: z.string().optional(),
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
    const courseSlug = params.get("course") ?? undefined;
    if (!courseSlug) return { course: null };
    const course = await getPublicCourse({ data: { slug: courseSlug } });
    return { course };
  },
  component: CheckoutRoute,
});

function CheckoutRoute() {
  const { plan, course, ref } = Route.useSearch();
  const { course: initialCourse } = Route.useLoaderData();
  return (
    <CheckoutPage
      plan={plan}
      courseSlug={course}
      refCode={ref}
      initialCourse={initialCourse}
    />
  );
}
