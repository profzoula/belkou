import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { CoursePlayer } from "@/components/course/CoursePlayer";
import { loadCoursePage } from "@/lib/load-course";
import { seoHead } from "@/lib/seo";

const searchSchema = z.object({
  lesson: z.string().optional(),
});

export const Route = createFileRoute("/courses/$slug/learn")({
  head: ({ loaderData }) =>
    seoHead({
      title: `${loaderData.title} — Leçons — BelKou`,
      description: loaderData.description,
      path: `/courses/${loaderData.slug}/learn`,
    }),
  validateSearch: searchSchema,
  loader: ({ params }) => loadCoursePage(params.slug),
  component: CourseLearnPage,
});

function CourseLearnPage() {
  const course = Route.useLoaderData();
  const { lesson } = Route.useSearch();

  return <CoursePlayer course={course} initialLessonId={lesson} />;
}
