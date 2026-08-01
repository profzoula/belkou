import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Gift, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseCatalogCard } from "@/components/course/CourseCatalogCard";
import { FadeIn } from "@/components/motion/FadeIn";
import { isFreeCourse } from "@/lib/courses";
import type { PublicCourse } from "@/lib/fns/courses";
import { cn } from "@/lib/utils";

type TrendingCoursesProps = {
  courses: PublicCourse[];
  maxVisible?: number;
};

type CourseFilter = "all" | "paid" | "free";

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
        <FadeIn className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
            Nos formations
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Développez vos compétences avec nos cours les plus populaires
          </p>
        </FadeIn>

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
                  "inline-flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors touch-target",
                  active
                    ? "border-primary bg-primary text-primary-foreground shadow-primary"
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
          <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((course, index) => (
              <FadeIn key={course.slug} delay={Math.min(index * 0.05, 0.2)}>
                <CourseCatalogCard course={course} />
              </FadeIn>
            ))}
          </div>
        )}

        <div className="mt-10 flex justify-center">
          <Button asChild size="lg" variant="hero" className="rounded-xl px-8 touch-target">
            <Link to="/courses">Voir toutes les formations</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
