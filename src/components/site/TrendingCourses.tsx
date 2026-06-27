import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Gift, Star, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseThumbnailBanner } from "@/components/course/CourseThumbnailBanner";
import { formatCount, isFreeCourse } from "@/lib/courses";
import type { PublicCourse } from "@/lib/fns/courses";
import { cn } from "@/lib/utils";

type TrendingCoursesProps = {
  courses: PublicCourse[];
  maxVisible?: number;
};

type CourseFilter = "all" | "paid" | "free";

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-sm font-bold text-foreground">{rating.toFixed(1)}</span>
      <div className="flex items-center gap-0.5" aria-hidden>
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            className={cn(
              "h-3.5 w-3.5",
              index < Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-muted/80 text-muted/80",
            )}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">({formatCount(count)})</span>
    </div>
  );
}

function FormationCard({ course }: { course: PublicCourse }) {
  const free = isFreeCourse(course);

  return (
    <Link
      to="/courses/$slug"
      params={{ slug: course.slug }}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/20 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
        <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-1.5">
          {course.bestseller ? (
            <span className="rounded-md bg-amber-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-950 shadow-sm">
              Bestseller
            </span>
          ) : null}
          {free ? (
            <span className="rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
              Gratuit
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 min-h-[2.75rem] text-sm font-bold leading-snug text-foreground group-hover:text-primary">
          {course.title}
        </h3>
        <p className="mt-1 truncate text-xs text-muted-foreground">{course.instructor}</p>

        <div className="mt-3">
          <StarRating rating={course.rating} count={course.ratingsCount} />
        </div>

        <div className="mt-auto pt-4">
          {free ? (
            <span className="text-lg font-bold text-emerald-600">Gratuit</span>
          ) : (
            <span className="text-lg font-bold text-foreground">
              ${Number.isInteger(course.price) ? course.price : course.price.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

const filters: { id: CourseFilter; label: string; icon?: typeof Wallet }[] = [
  { id: "all", label: "Tout" },
  { id: "paid", label: "Payant", icon: Wallet },
  { id: "free", label: "Gratuit", icon: Gift },
];

export function TrendingCourses({ courses, maxVisible = 8 }: TrendingCoursesProps) {
  const [filter, setFilter] = useState<CourseFilter>("all");

  const filtered = useMemo(() => {
    let list = courses;
    if (filter === "paid") list = courses.filter((course) => !isFreeCourse(course));
    if (filter === "free") list = courses.filter(isFreeCourse);
    return list.slice(0, maxVisible);
  }, [courses, filter, maxVisible]);

  if (courses.length === 0) return null;

  return (
    <section id="courses" className="site-section-anchor section-divider py-16 sm:py-20 md:py-24">
      <div className="site-container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">Nos Formations</h2>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground">
            Développez vos compétences avec nos cours les plus populaires
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          {filters.map((item) => {
            const active = filter === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors touch-target",
                  active
                    ? "border-foreground bg-foreground text-background shadow-sm"
                    : "border-border bg-card text-foreground hover:bg-accent",
                )}
              >
                {Icon ? <Icon className="h-4 w-4" /> : null}
                {item.label}
              </button>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <p className="mt-10 text-center text-sm text-muted-foreground">
            Aucune formation dans cette catégorie pour le moment.
          </p>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((course) => (
              <FormationCard key={course.slug} course={course} />
            ))}
          </div>
        )}

        <div className="mt-10 flex justify-center">
          <Button asChild size="lg" variant="hero" className="rounded-full px-8 touch-target">
            <Link to="/courses">Voir toutes les formations</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
