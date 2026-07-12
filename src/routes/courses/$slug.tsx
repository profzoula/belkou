import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { CourseLandingPage } from "@/components/course/CourseLandingPage";
import { loadCoursePage } from "@/lib/load-course";
import type { PublicCourse } from "@/lib/fns/courses";
import { seoHead, courseJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/site/JsonLd";

export const Route = createFileRoute("/courses/$slug")({
  head: ({ loaderData }) => {
    const course = loaderData as PublicCourse | undefined;
    if (!course) return {};
    return seoHead({
      title: `${course.title} — BelKou`,
      description: course.description,
      path: `/courses/${course.slug}`,
    });
  },
  loader: ({ params }) => loadCoursePage(params.slug),
  component: CourseSlugRoute,
});

function CourseSlugRoute() {
  const course = Route.useLoaderData() as PublicCourse | undefined;
  const isLearnRoute = useRouterState({
    select: (state) => /\/learn\/?$/.test(state.location.pathname),
  });

  if (!course) return null;

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
