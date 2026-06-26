import { Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Play, Star, Users } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { Button } from "@/components/ui/button";
import { CourseThumbnailBanner } from "@/components/course/CourseThumbnailBanner";
import { CourseScheduleBadge } from "@/components/course/CourseScheduleBadge";
import { formatCount, getFirstPreviewVideoLesson } from "@/lib/courses";
import { isCourseContentLive } from "@/lib/course-publish";
import type { PublicCourse } from "@/lib/fns/courses";

type HeroProps = {
  studentCount: number;
  courses: PublicCourse[];
};

function averageRating(courses: PublicCourse[]): string {
  if (!courses.length) return siteConfig.stats.rating;
  const total = courses.reduce((sum, course) => sum + course.rating, 0);
  return (total / courses.length).toFixed(1);
}

function FeaturedCourseCard({ course, compact = false }: { course: PublicCourse; compact?: boolean }) {
  const previewLesson = getFirstPreviewVideoLesson(course);

  return (
    <Link
      to="/courses/$slug"
      params={{ slug: course.slug }}
      className="group block surface overflow-hidden rounded-2xl border border-border shadow-lg transition-all hover:shadow-xl hover:border-primary/30"
    >
      <CourseThumbnailBanner
        thumbnail={course.thumbnail}
        slug={course.slug}
        className={compact ? "p-4" : "p-6"}
        showLabel={false}
        showIcon={false}
      >
        <CourseScheduleBadge scheduledPublishAt={course.scheduledPublishAt} variant="overlay" />
        {course.bestseller && (
          <span className="absolute right-4 top-4 z-10 rounded-sm bg-teal-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            Bestseller
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/60 to-transparent p-4 pt-12">
          <h3
            className={`line-clamp-2 font-display font-bold text-white leading-snug group-hover:underline ${compact ? "text-base" : "text-lg"}`}
          >
            {course.title}
          </h3>
        </div>
      </CourseThumbnailBanner>
      <div className={compact ? "p-3 sm:p-4" : "p-4 sm:p-5"}>
        <p className="truncate text-sm text-muted-foreground">{course.instructor}</p>
        <div className="mt-2">
          <CourseScheduleBadge scheduledPublishAt={course.scheduledPublishAt} />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-0.5 font-bold text-amber-600">
            {course.rating.toFixed(1)}
            <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
          </span>
          <span className="text-muted-foreground">({formatCount(course.ratingsCount)} avis)</span>
          {!compact && <span className="text-muted-foreground">· {course.totalDuration}</span>}
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold">${course.price}</span>
            <span className="text-sm text-muted-foreground line-through">${course.originalPrice}</span>
          </div>
          {previewLesson && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
              <Play className="h-3.5 w-3.5" />
              Preview
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function Hero({ studentCount, courses }: HeroProps) {
  const studentLabel = formatCount(studentCount);
  const courseCount = courses.length;
  const liveCount = courses.filter((course) => isCourseContentLive(course)).length;
  const ratingLabel = averageRating(courses);

  const featuredCourses = [...courses]
    .sort((a, b) => Number(b.bestseller) - Number(a.bestseller))
    .slice(0, Math.min(3, courses.length));

  const stats = [
    { n: String(courseCount || 0), l: "Cours au catalogue", icon: BookOpen },
    { n: studentLabel, l: "Étudiants formés", suffix: "+", icon: Users },
    { n: ratingLabel, l: "Note moyenne", suffix: "/5", icon: Star },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-mesh site-page-top pb-10 sm:pb-14 md:pb-16">
      <div aria-hidden className="pointer-events-none absolute top-20 left-1/4 h-72 w-72 rounded-full bg-primary/8 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute top-32 right-0 h-96 w-96 rounded-full bg-primary/8 blur-3xl" />

      <div className="site-container relative pt-8 sm:pt-10 lg:pt-12 min-w-0">
        <div className="grid min-w-0 lg:grid-cols-2 gap-10 xl:gap-14 items-start">
          <div className="min-w-0 text-center lg:text-left animate-fade-up">
            <div className="inline-flex flex-wrap items-center justify-center lg:justify-start gap-2 badge mb-5 sm:mb-6">
              <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                {ratingLabel}/5
              </span>
              <span className="text-muted-foreground">·</span>
              <span>
                <span className="font-semibold text-foreground">{studentLabel}+</span> étudiants
              </span>
              {courseCount > 0 && (
                <>
                  <span className="text-muted-foreground">·</span>
                  <span>
                    <span className="font-semibold text-foreground">{courseCount}</span> cours
                    {liveCount > 0 && liveCount < courseCount ? (
                      <span className="text-muted-foreground"> ({liveCount} disponibles)</span>
                    ) : null}
                  </span>
                </>
              )}
            </div>

            <h1 className="font-display text-[1.75rem] sm:text-[2.75rem] md:text-[3rem] lg:text-[3.15rem] font-bold leading-[1.1] mb-4 sm:mb-5 text-balance">
              La plateforme de <span className="text-gradient">cours IA & SaaS</span> en français
            </h1>

            <p className="max-w-xl mx-auto lg:mx-0 text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 leading-relaxed">
              Choisissez parmi {courseCount > 0 ? `${courseCount} formations` : "nos formations"} en vidéo — apps,
              déploiement, monétisation. Preview gratuite, paiement par cours, accès à vie.
            </p>

            <div className="flex w-full max-w-full flex-col sm:flex-row items-stretch sm:items-center lg:items-start justify-center lg:justify-start gap-3 mb-6">
              <Button asChild variant="hero" size="lg" className="w-full sm:w-auto touch-target px-6 sm:px-8">
                <Link to="/courses">
                  Explorer le catalogue <ArrowRight className="h-4 w-4 shrink-0" />
                </Link>
              </Button>
              {featuredCourses[0] && (
                <Button asChild variant="soft" size="lg" className="w-full sm:w-auto touch-target px-6 sm:px-8">
                  <Link to="/courses/$slug" params={{ slug: featuredCourses[0].slug }}>
                    <Play className="h-4 w-4 shrink-0" /> Voir un cours
                  </Link>
                </Button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3 max-w-lg mx-auto lg:mx-0">
              {stats.map((s) => (
                <div key={s.l} className="stat-card text-left! py-3 px-3 sm:px-4">
                  <div className="font-display text-lg sm:text-xl font-bold text-foreground">
                    {s.n}
                    {s.suffix && <span className="text-primary">{s.suffix}</span>}
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 leading-snug">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {featuredCourses.length > 0 && (
            <div className="min-w-0 animate-fade-up [animation-delay:80ms] lg:sticky lg:top-[calc(var(--site-header-height)+1rem)]">
              <p className="mb-3 text-center lg:text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {featuredCourses.length > 1 ? "Cours à la une" : "Cours en vedette"}
              </p>
              {featuredCourses.length === 1 ? (
                <FeaturedCourseCard course={featuredCourses[0]} />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-1">
                  {featuredCourses.map((course) => (
                    <FeaturedCourseCard key={course.slug} course={course} compact={featuredCourses.length > 1} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
