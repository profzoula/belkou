import { Link } from "@tanstack/react-router";
import { BadgeCheck, ChevronRight, Clock3, Star } from "lucide-react";
import { CourseThumbnailBanner } from "@/components/course/CourseThumbnailBanner";
import { FadeIn } from "@/components/motion/FadeIn";
import { formatCount, isFreeCourse } from "@/lib/courses";
import type { PublicCourse } from "@/lib/fns/courses";
import { cn } from "@/lib/utils";

type RecommendedForYouProps = {
  courses: PublicCourse[];
  maxVisible?: number;
};

function RecommendedCard({ course }: { course: PublicCourse }) {
  const free = isFreeCourse(course);

  return (
    <Link
      to="/courses/$slug"
      params={{ slug: course.slug }}
      className={cn(
        "group flex h-full w-[16.5rem] shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-200",
        "active:scale-[0.98] sm:w-full sm:hover:-translate-y-0.5 sm:hover:border-primary/25 sm:hover:shadow-md",
      )}
    >
      <div className="relative">
        <CourseThumbnailBanner
          thumbnail={course.thumbnail}
          slug={course.slug}
          aspectClass="aspect-[16/10]"
          className="rounded-none border-0"
          showLabel={false}
          showIcon={!course.thumbnail.imageUrl}
        />
        {course.bestseller ? (
          <span className="absolute left-2.5 top-2.5 z-10 rounded-md bg-brand-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-accent-foreground shadow-sm">
            Bestseller
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <h3 className="line-clamp-2 min-h-[2.5rem] font-display text-sm font-semibold leading-snug text-foreground group-hover:text-primary">
          {course.title}
        </h3>

        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 font-semibold text-foreground">
            <Star className="size-3.5 fill-brand-accent text-brand-accent" aria-hidden />
            {course.rating.toFixed(1)}
            <span className="font-normal text-muted-foreground">({formatCount(course.ratingsCount)})</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock3 className="size-3.5" aria-hidden />
            {course.totalDuration}
          </span>
        </div>

        <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-primary">
          <BadgeCheck className="size-3.5 shrink-0" aria-hidden />
          Formateur vérifié
        </p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <span className="text-base font-bold text-foreground">
            {free ? <span className="text-success">Gratuit</span> : `$${course.price}`}
          </span>
          <span className="inline-flex h-8 items-center rounded-full bg-primary px-3 text-xs font-semibold text-primary-foreground">
            Voir
          </span>
        </div>
      </div>
    </Link>
  );
}

export function RecommendedForYou({ courses, maxVisible = 8 }: RecommendedForYouProps) {
  const recommended = courses.slice(0, maxVisible);

  if (recommended.length === 0) return null;

  return (
    <section id="courses" className="site-section-anchor py-6 sm:py-12 md:py-16">
      <div className="site-container">
        <FadeIn className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold tracking-tight text-foreground sm:text-2xl md:text-3xl">
            Recommended for you
          </h2>
          <Link
            to="/courses"
            className="inline-flex shrink-0 items-center gap-0.5 text-xs font-medium text-muted-foreground transition-colors hover:text-primary sm:text-sm"
          >
            Voir tout
            <ChevronRight className="size-3.5 sm:size-4" aria-hidden />
          </Link>
        </FadeIn>
      </div>

      <div className="mt-4 sm:mt-8">
        <div className="flex gap-3 overflow-x-auto px-4 pb-2 snap-x snap-mandatory sm:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {recommended.map((course) => (
            <div key={course.slug} className="snap-start">
              <RecommendedCard course={course} />
            </div>
          ))}
        </div>

        <div className="site-container hidden gap-3 sm:grid sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {recommended.map((course, index) => (
            <FadeIn key={course.slug} delay={Math.min(index * 0.05, 0.2)}>
              <RecommendedCard course={course} />
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
