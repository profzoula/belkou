import { Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Play, Star, Users } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { Button } from "@/components/ui/button";
import { ToolsStrip } from "@/components/site/ToolsStrip";
import { formatCount } from "@/lib/courses";
import { getCourseIcon } from "@/lib/course-icons";
import type { PublicCourse } from "@/lib/fns/courses";

type HeroProps = {
  studentCount: number;
  courses: PublicCourse[];
};

function FeaturedCourseCard({ course }: { course: PublicCourse }) {
  const Icon = getCourseIcon(course.slug);
  const previewLesson = course.sections
    .flatMap((s) => s.lessons)
    .find((l) => l.preview && l.type === "video");

  return (
    <Link
      to="/courses/$slug"
      params={{ slug: course.slug }}
      className="group block surface overflow-hidden rounded-2xl border border-border shadow-lg transition-all hover:shadow-xl hover:border-primary/30"
    >
      <div className={`relative aspect-[16/10] bg-gradient-to-br ${course.thumbnail.gradient} p-6`}>
        {course.bestseller && (
          <span className="absolute left-4 top-4 rounded-sm bg-teal-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            Bestseller
          </span>
        )}
        <Icon className="absolute right-4 top-4 h-12 w-12 text-white/20" aria-hidden />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 pt-12">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-white/80">{course.thumbnail.label}</p>
          <h3 className="mt-1 line-clamp-2 font-display text-lg font-bold text-white leading-snug group-hover:underline">
            {course.title}
          </h3>
        </div>
      </div>
      <div className="p-4 sm:p-5">
        <p className="truncate text-sm text-muted-foreground">{course.instructor}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-0.5 font-bold text-amber-600">
            {course.rating.toFixed(1)}
            <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
          </span>
          <span className="text-muted-foreground">({formatCount(course.ratingsCount)} avis)</span>
          <span className="text-muted-foreground">· {course.totalDuration}</span>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold">${course.price}</span>
            <span className="text-sm text-muted-foreground line-through">${course.originalPrice}</span>
          </div>
          {previewLesson && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
              <Play className="h-3.5 w-3.5" />
              Preview gratuite
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
  const featured = courses.find((c) => c.bestseller) ?? courses[0];

  const stats = [
    { n: String(courseCount || 1), l: "Cours disponibles", icon: BookOpen },
    { n: studentLabel, l: "Étudiants formés", suffix: "+", icon: Users },
    { n: siteConfig.stats.rating, l: "Note moyenne", suffix: "/5", icon: Star },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-mesh site-page-top pb-10 sm:pb-14 md:pb-16">
      <div aria-hidden className="pointer-events-none absolute top-20 left-1/4 h-72 w-72 rounded-full bg-primary/8 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute top-32 right-0 h-96 w-96 rounded-full bg-amber-300/10 blur-3xl" />

      <div className="site-container relative pt-8 sm:pt-10 lg:pt-12 min-w-0">
        <div className="grid min-w-0 lg:grid-cols-2 gap-10 xl:gap-14 items-start">
          <div className="min-w-0 text-center lg:text-left animate-fade-up">
            <div className="inline-flex flex-wrap items-center justify-center lg:justify-start gap-2 badge mb-5 sm:mb-6">
              <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                {siteConfig.stats.rating}/5
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
                  </span>
                </>
              )}
            </div>

            <h1 className="font-display text-[1.75rem] sm:text-[2.75rem] md:text-[3rem] lg:text-[3.15rem] font-bold leading-[1.1] mb-4 sm:mb-5 text-balance">
              Apprenez à créer des <span className="text-gradient">apps IA & SaaS</span> — cours en vidéo
            </h1>

            <p className="max-w-xl mx-auto lg:mx-0 text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 leading-relaxed">
              Parcourez notre catalogue de formations en français. Cursor, Claude, Supabase, Stripe — progressez à votre
              rythme, avec preview gratuite sur chaque cours.
            </p>

            <div className="flex w-full max-w-full flex-col sm:flex-row items-stretch sm:items-center lg:items-start justify-center lg:justify-start gap-3 mb-6">
              <Button asChild variant="hero" size="lg" className="w-full sm:w-auto touch-target px-6 sm:px-8">
                <Link to="/courses">
                  Explorer les cours <ArrowRight className="h-4 w-4 shrink-0" />
                </Link>
              </Button>
              {featured && (
                <Button asChild variant="soft" size="lg" className="w-full sm:w-auto touch-target px-6 sm:px-8">
                  <Link to="/courses/$slug" params={{ slug: featured.slug }}>
                    <Play className="h-4 w-4 shrink-0" /> Cours en vedette
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

          {featured && (
            <div className="min-w-0 animate-fade-up [animation-delay:80ms] lg:sticky lg:top-[calc(var(--site-header-height)+1rem)]">
              <p className="mb-3 text-center lg:text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Cours en vedette
              </p>
              <FeaturedCourseCard course={featured} />
            </div>
          )}
        </div>

        <div className="mt-10 sm:mt-12 animate-fade-up [animation-delay:120ms]">
          <ToolsStrip variant="marquee" logosOnly showLabel={false} align="left" bordered={false} />
        </div>
      </div>
    </section>
  );
}
