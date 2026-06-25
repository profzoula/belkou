import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Star } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { formatCount } from "@/lib/courses";
import { isScheduledInFuture, formatScheduledPublishLabel } from "@/lib/course-publish";
import { getPublicCourses } from "@/lib/fns/courses";
import { CourseThumbnailBanner } from "@/components/course/CourseThumbnailBanner";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/courses/")({
  head: () =>
    seoHead({
      title: "Cours — BelKou",
      description: "Explorez les cours BelKou : apps IA, SaaS, déploiement et monétisation.",
      path: "/courses",
    }),
  loader: async () => {
    const publicCourses = await getPublicCourses();
    return { courses: publicCourses };
  },
  component: CoursesIndexPage,
});

function CoursesIndexPage() {
  const { courses } = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="site-page-top site-container py-10 sm:py-14">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Nos cours</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Formations pratiques pour créer, déployer et monétiser vos applications avec l&apos;IA.
        </p>

        {courses.length === 0 ? (
          <p className="mt-10 text-muted-foreground">Aucun cours disponible pour le moment.</p>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
            {courses.map((course) => (
              <Link
                key={course.slug}
                to="/courses/$slug"
                params={{ slug: course.slug }}
                className="group flex overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md"
              >
                <CourseThumbnailBanner
                  thumbnail={course.thumbnail}
                  slug={course.slug}
                  aspectClass="aspect-auto w-36 sm:w-44 min-h-full"
                  className="shrink-0"
                  showLabel={false}
                />
                  <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="line-clamp-2 font-bold leading-snug group-hover:text-primary">{course.title}</h2>
                      {isScheduledInFuture(course) && course.scheduledPublishAt && (
                        <span className="shrink-0 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-800">
                          Vidéos le {formatScheduledPublishLabel(course.scheduledPublishAt)}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{course.instructor}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <span className="inline-flex items-center gap-0.5 font-bold text-amber-600">
                        {course.rating.toFixed(1)}
                        <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                      </span>
                      <span className="text-muted-foreground">({formatCount(course.ratingsCount)})</span>
                      <span className="text-muted-foreground">· {course.totalDuration}</span>
                    </div>
                    <div className="mt-auto flex items-baseline gap-2 pt-3">
                      <span className="font-bold">${course.price}</span>
                      <span className="text-sm text-muted-foreground line-through">${course.originalPrice}</span>
                    </div>
                  </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <Button asChild variant="hero" className="rounded-full">
            <Link to="/register">
              Rejoindre la formation
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
