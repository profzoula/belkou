import { Clock3, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

type LessonContextHeaderProps = {
  courseTitle: string;
  moduleTitle?: string;
  lessonNumber: number;
  lessonTitle: string;
  lessonDescription?: string;
  instructor?: string;
  duration?: string | null;
  publishedLabel?: string;
  className?: string;
};

export function LessonContextHeader({
  courseTitle,
  moduleTitle,
  lessonNumber,
  lessonTitle,
  lessonDescription,
  instructor,
  duration,
  publishedLabel,
  className,
}: LessonContextHeaderProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <nav
        aria-label="Fil d'Ariane"
        className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground"
      >
        <span className="truncate">{courseTitle}</span>
        {moduleTitle ? (
          <>
            <span aria-hidden>/</span>
            <span className="truncate">{moduleTitle}</span>
          </>
        ) : null}
        <span aria-hidden>/</span>
        <span className="font-medium text-foreground">Leçon {lessonNumber}</span>
      </nav>

      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground text-balance sm:text-[32px] sm:leading-tight">
          {lessonTitle}
        </h1>
        {lessonDescription ? (
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {lessonDescription}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
        {instructor ? (
          <span className="inline-flex items-center gap-1.5">
            <UserRound className="size-4 text-primary" aria-hidden />
            {instructor}
          </span>
        ) : null}
        {duration ? (
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="size-4" aria-hidden />
            {duration}
          </span>
        ) : null}
        {publishedLabel ? <span>Mis à jour {publishedLabel}</span> : null}
      </div>
    </div>
  );
}
