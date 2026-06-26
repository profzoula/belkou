import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { CourseLandingPage } from "@/components/course/CourseLandingPage";
import { loadCoursePage } from "@/lib/load-course";
import { seoHead, courseJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/site/JsonLd";

export const Route = createFileRoute("/courses/$slug")({
  head: ({ loaderData }) =>
    seoHead({
      title: `${loaderData.title} — BelKou`,
      description: loaderData.description,
      path: `/courses/${loaderData.slug}`,
    }),
  loader: ({ params }) => loadCoursePage(params.slug),
  component: CourseSlugRoute,
});

function CourseSlugRoute() {
  const course = Route.useLoaderData();
  const isLearnRoute = useRouterState({
    select: (state) => /\/learn\/?$/.test(state.location.pathname),
  });

  if (isLearnRoute) {
    return <Outlet />;
  }

  return (
    <>
      <JsonLd data={[courseJsonLd()]} />
      <CourseLandingPage course={course} />
    </>
  );
}
