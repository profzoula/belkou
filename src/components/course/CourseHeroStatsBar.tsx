import { Star } from "lucide-react";
import {
  countLessons,
  formatCount,
  getCourseDisplayDuration,
  type Course,
} from "@/lib/courses";
import { cn } from "@/lib/utils";

type CourseHeroStatsBarProps = {
  course: Pick<Course, "sections" | "rating" | "ratingsCount" | "skillLevel">;
  className?: string;
};

const skillLevelHints: Record<string, string> = {
  Débutant: "Aucune expérience requise",
  Intermédiaire: "Bases recommandées",
  Avancé: "Expérience préalable utile",
};

export function CourseHeroStatsBar({ course, className }: CourseHeroStatsBarProps) {
  const lessonCount = countLessons(course);
  const sectionCount = course.sections.length;
  const duration = getCourseDisplayDuration(course);
  const levelHint = skillLevelHints[course.skillLevel] ?? "Adapté à votre niveau";

  const items = [
    {
      title: `${sectionCount} partie${sectionCount > 1 ? "s" : ""} · ${lessonCount} leçon${lessonCount > 1 ? "s" : ""}`,
      subtitle: "Parcours structuré pas à pas",
      underline: true,
    },
    {
      title: (
        <>
          {course.rating.toFixed(1)}{" "}
          <Star className="inline size-4 fill-brand-accent text-brand-accent" aria-hidden />
        </>
      ),
      subtitle: `${formatCount(course.ratingsCount)} avis sur ce cours`,
    },
    {
      title: `Niveau ${course.skillLevel}`,
      subtitle: levelHint,
    },
    {
      title: duration,
      subtitle: "Apprenez à votre rythme · accès à vie",
    },
  ] as const;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card shadow-[0_8px_30px_rgb(15_23_42_/_0.08)]",
        className,
      )}
    >
      <ul className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-y-0">
        {items.map((item, index) => (
          <li key={index} className="px-5 py-5 sm:px-6 sm:py-6">
            <p
              className={cn(
                "text-sm font-bold text-foreground sm:text-[0.9375rem]",
                item.underline && "underline decoration-foreground/30 underline-offset-4",
              )}
            >
              {item.title}
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground sm:text-[0.8125rem]">
              {item.subtitle}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
