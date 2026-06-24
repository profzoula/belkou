import { createFileRoute } from "@tanstack/react-router";
import { CourseLandingPage } from "@/components/course/CourseLandingPage";
import { loadCoursePage } from "@/lib/load-course";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/courses/$slug")({
  head: ({ loaderData }) =>
    seoHead({
      title: `${loaderData.title} — BelKou`,
      description: loaderData.description,
      path: `/courses/${loaderData.slug}`,
    }),
  loader: ({ params }) => loadCoursePage(params.slug),
  component: CourseLandingPageRoute,
});

function CourseLandingPageRoute() {
  const course = Route.useLoaderData();
  return <CourseLandingPage course={course} />;
}
