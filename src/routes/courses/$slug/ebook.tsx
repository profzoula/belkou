import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { ExamEbookViewer } from "@/components/course/ExamEbookViewer";
import { Button } from "@/components/ui/button";
import { getExamEbookForCourse } from "@/lib/exam-ebooks";
import { loadCoursePage } from "@/lib/load-course";
import type { PublicCourse } from "@/lib/fns/courses";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/courses/$slug/ebook")({
  head: ({ loaderData, params }) => {
    const course = loaderData as PublicCourse | null | undefined;
    const ebook = getExamEbookForCourse(params.slug);
    if (!course || !ebook) return {};
    return seoHead({
      title: `${ebook.title} — BelKou`,
      description: course.description,
      path: `/courses/${course.slug}/ebook`,
      noindex: true,
    });
  },
  loader: async ({ params }) => {
    const ebook = getExamEbookForCourse(params.slug);
    if (!ebook) return null;
    return loadCoursePage(params.slug);
  },
  component: CourseEbookPage,
});

function CourseEbookPage() {
  const { slug } = Route.useParams();
  const course = Route.useLoaderData() as PublicCourse | null | undefined;
  const ebook = getExamEbookForCourse(slug);

  if (!ebook || !course) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="font-semibold">Banque de questions introuvable</p>
        <Button asChild variant="outline">
          <Link to="/courses">Retour au catalogue</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[#0e2744]">
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2 sm:px-4">
        <Button
          asChild
          size="sm"
          variant="ghost"
          className="text-white hover:bg-white/10 hover:text-white"
        >
          <Link to="/courses/$slug/learn" params={{ slug }} search={{ lesson: "banque-questions" }}>
            <ArrowLeft className="size-4" aria-hidden />
            Leçons
          </Link>
        </Button>
        <p className="truncate text-sm text-white/80">{course.title}</p>
      </div>
      <ExamEbookViewer
        courseSlug={slug}
        title={ebook.title}
        variant="page"
        className="min-h-0 flex-1"
      />
    </div>
  );
}
