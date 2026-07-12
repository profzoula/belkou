import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { CoursePlayer } from "@/components/course/CoursePlayer";
import { loadCoursePage } from "@/lib/load-course";
import type { PublicCourse } from "@/lib/fns/courses";
import { seoHead } from "@/lib/seo";

const searchSchema = z.object({
  lesson: z.string().optional(),
});

export const Route = createFileRoute("/courses/$slug/learn")({
  head: ({ loaderData }) => {
    const course = loaderData as PublicCourse | undefined;
    if (!course) return {};
    return seoHead({
      title: `${course.title} — Leçons — BelKou`,
      description: course.description,
      path: `/courses/${course.slug}/learn`,
    });
  },
  validateSearch: searchSchema,
  loader: ({ params }) => loadCoursePage(params.slug),
  component: CourseLearnPage,
});

function CourseLearnPage() {
  const course = Route.useLoaderData() as PublicCourse | undefined;
  const { lesson } = Route.useSearch();

  if (!course) return null;

  return <CoursePlayer course={course} initialLessonId={lesson} />;
}
