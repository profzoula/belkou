import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Clock3, Star, Users } from "lucide-react";
import { CourseThumbnailBanner } from "@/components/course/CourseThumbnailBanner";
import { FadeIn } from "@/components/motion/FadeIn";
import { COURSE_CATEGORIES } from "@/lib/course-categories";
import { formatCount, isFreeCourse } from "@/lib/courses";
import type { PublicCourse } from "@/lib/fns/courses";
import { cn } from "@/lib/utils";

type CoursesSectionProps = {
  courses: PublicCourse[];
  maxVisible?: number;
};

function HomeCourseCard({ course }: { course: PublicCourse }) {
  const free = isFreeCourse(course);

  return (
    <Link
      to="/courses/$slug"
      params={{ slug: course.slug }}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md"
    >
      <CourseThumbnailBanner
        thumbnail={course.thumbnail}
        slug={course.slug}
        aspectClass="aspect-[16/10]"
        className="rounded-none border-0"
        showLabel={false}
        showIcon={!course.thumbnail.imageUrl}
      />

      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <p className="truncate text-xs text-muted-foreground">{course.instructor}</p>

        <h3 className="mt-2 line-clamp-2 min-h-[2.5rem] font-display text-sm font-semibold leading-snug text-foreground group-hover:text-primary sm:text-base">
          {course.title}
        </h3>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock3 className="size-3.5" aria-hidden />
            {course.totalDuration}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="size-3.5" aria-hidden />
            {formatCount(course.studentsCount)} étudiants
          </span>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-primary/10 bg-primary/[0.04] px-3.5 py-3 sm:px-4">
        <div className="min-w-0">
          {free ? (
            <span className="text-base font-bold text-success">Gratuit</span>
          ) : (
            <div className="flex flex-wrap items-baseline gap-1.5">
              <span className="text-base font-bold text-primary">
                ${Number.isInteger(course.price) ? course.price : course.price.toFixed(2)}
              </span>
              {course.originalPrice > course.price ? (
                <span className="text-xs text-muted-foreground line-through">
                  ${course.originalPrice}
                </span>
              ) : null}
            </div>
          )}
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-foreground">
          {course.rating.toFixed(1)}
          <Star className="size-3.5 fill-brand-accent text-brand-accent" aria-hidden />
        </span>
      </div>
    </Link>
  );
}

export function CoursesSection({ courses, maxVisible = 6 }: CoursesSectionProps) {
  const [category, setCategory] = useState<string>("all");
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const filtered = useMemo(() => {
    return courses
      .filter((course) => {
        if (category === "all") return true;
        return (course.categories ?? []).includes(category);
      })
      .slice(0, maxVisible);
  }, [category, courses, maxVisible]);

  const updateScrollState = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateScrollState();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, []);

  const scrollCats = (dir: -1 | 1) => {
    scrollerRef.current?.scrollBy({ left: dir * 180, behavior: "smooth" });
  };

  return (
    <section id="courses" className="site-section-anchor py-10 sm:py-16 md:py-20">
      <div className="site-container">
        <FadeIn delay={0.06}>
          <div className="flex items-center gap-2 rounded-2xl bg-primary/[0.06] p-2 sm:gap-3 sm:p-3">
            <button
              type="button"
              aria-label="Catégories précédentes"
              disabled={!canScrollLeft}
              onClick={() => scrollCats(-1)}
              className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-foreground transition enabled:hover:border-primary/30 disabled:cursor-default disabled:opacity-40"
            >
              <ChevronLeft className="size-4" />
            </button>

            <div
              ref={scrollerRef}
              className="flex min-w-0 flex-1 gap-2 overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <button
                type="button"
                onClick={() => setCategory("all")}
                aria-pressed={category === "all"}
                className={cn(
                  "shrink-0 cursor-pointer rounded-full border px-4 py-2 text-xs font-semibold whitespace-nowrap transition-colors sm:text-sm",
                  category === "all"
                    ? "border-primary bg-card text-primary shadow-sm"
                    : "border-transparent bg-transparent text-muted-foreground hover:border-border hover:bg-card hover:text-foreground",
                )}
              >
                Tous
              </button>
              {COURSE_CATEGORIES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCategory(item.id)}
                  aria-pressed={category === item.id}
                  className={cn(
                    "shrink-0 cursor-pointer rounded-full border px-4 py-2 text-xs font-semibold whitespace-nowrap transition-colors sm:text-sm",
                    category === item.id
                      ? "border-primary bg-card text-primary shadow-sm"
                      : "border-transparent bg-transparent text-muted-foreground hover:border-border hover:bg-card hover:text-foreground",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              aria-label="Catégories suivantes"
              disabled={!canScrollRight}
              onClick={() => scrollCats(1)}
              className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-foreground transition enabled:hover:border-primary/30 disabled:cursor-default disabled:opacity-40"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </FadeIn>

        {filtered.length === 0 ? (
          <p className="mt-12 text-center text-sm text-muted-foreground">
            Aucun cours dans cette catégorie pour le moment.
          </p>
        ) : (
          <div
            className={cn(
              "mt-8 grid gap-3 sm:mt-10 sm:gap-5",
              filtered.length === 1 && "mx-auto max-w-sm grid-cols-1 sm:max-w-md lg:max-w-lg",
              filtered.length === 2 && "mx-auto max-w-3xl grid-cols-2 lg:max-w-4xl",
              filtered.length >= 3 && "grid-cols-2 lg:grid-cols-3",
            )}
          >
            {filtered.map((course, index) => (
              <FadeIn key={course.slug} delay={Math.min(index * 0.04, 0.2)}>
                <HomeCourseCard course={course} />
              </FadeIn>
            ))}
          </div>
        )}

        <div className="mt-10 flex justify-center">
          <Link
            to="/courses"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-primary/35 bg-primary/5 px-8 text-sm font-semibold text-primary transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Autres cours
          </Link>
        </div>
      </div>
    </section>
  );
}
