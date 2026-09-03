import { Link } from "@tanstack/react-router";
import { BookOpen, Play } from "lucide-react";
import { FreeCourseAuthCta } from "@/components/course/FreeCourseAuthCta";
import { Button } from "@/components/ui/button";
import { formatCount, isFreeCourse } from "@/lib/courses";
import { cn } from "@/lib/utils";

type CourseHeroEnrollCtaProps = {
  courseSlug: string;
  price: number;
  studentCount: number;
  accessLoading?: boolean;
  hasPaidAccess: boolean;
  canStartCourse: boolean;
  enrolledWaiting: boolean;
  scheduledSoon: boolean;
  startLabel: string | null;
  hasPublicPreview: boolean;
  courseActionLabel: string;
  continueLearnSearch?: { lesson: string };
  playableLearnSearch?: { lesson: string };
  previewLearnSearch?: { lesson: string };
  progressPercent?: number;
  className?: string;
};

export function CourseHeroEnrollCta({
  courseSlug,
  price,
  studentCount,
  accessLoading = false,
  hasPaidAccess,
  canStartCourse,
  enrolledWaiting,
  scheduledSoon,
  startLabel,
  hasPublicPreview,
  courseActionLabel,
  continueLearnSearch,
  playableLearnSearch,
  previewLearnSearch,
  progressPercent = 0,
  className,
}: CourseHeroEnrollCtaProps) {
  if (accessLoading) {
    return (
      <div className={cn("mt-5 flex flex-col items-start gap-2", className)} aria-busy="true" aria-label="Chargement">
        <div className="h-11 w-44 rounded-md bg-muted" />
        <div className="mt-2 h-3 w-36 rounded bg-muted/70" />
      </div>
    );
  }

  const enrolledLabel = formatCount(studentCount);

  return (
    <div className={cn("mt-5 flex flex-col items-start gap-2", className)}>
      {canStartCourse ? (
        <Button
          asChild
          variant="hero"
          size="lg"
          className="h-auto min-w-[11rem] rounded-md px-5 py-2.5 text-left"
        >
          <Link
            to="/courses/$slug/learn"
            params={{ slug: courseSlug }}
            search={continueLearnSearch}
            className="flex flex-col items-start gap-0.5"
          >
            <span className="inline-flex items-center gap-1.5 text-base font-semibold">
              <BookOpen className="size-4" aria-hidden />
              {courseActionLabel}
            </span>
            {(progressPercent ?? 0) > 0 ? (
              <span className="text-xs font-normal opacity-90">{progressPercent}% terminé</span>
            ) : null}
          </Link>
        </Button>
      ) : hasPaidAccess ? (
        <Button
          asChild
          variant="hero"
          size="lg"
          className="h-auto min-w-[11rem] rounded-md px-5 py-2.5 text-left"
        >
          <Link
            to="/courses/$slug/learn"
            params={{ slug: courseSlug }}
            search={playableLearnSearch}
            className="flex flex-col items-start gap-0.5"
          >
            <span className="inline-flex items-center gap-1.5 text-base font-semibold">
              <Play className="size-4 fill-current" aria-hidden />
              {hasPublicPreview ? "Voir la preview" : "Voir la bienvenue"}
            </span>
            {enrolledWaiting && startLabel ? (
              <span className="text-xs font-normal opacity-90">Cours complet le {startLabel}</span>
            ) : null}
          </Link>
        </Button>
      ) : (
        <>
          {isFreeCourse({ price }) ? (
            <FreeCourseAuthCta slug={courseSlug} stacked={false} />
          ) : (
          <Button
            asChild
            variant="hero"
            size="lg"
            className="h-auto min-w-[11rem] rounded-md px-5 py-2.5 text-left"
          >
            <Link
              to="/checkout"
              search={{ course: courseSlug }}
              className="flex flex-col items-start gap-0.5"
            >
              <span className="text-base font-semibold">S&apos;inscrire · ${price}</span>
              {scheduledSoon && startLabel ? (
                <span className="text-xs font-normal opacity-90">Accès complet le {startLabel}</span>
              ) : (
                <span className="text-xs font-normal opacity-90">Paiement unique · accès à vie</span>
              )}
            </Link>
          </Button>
          )}

          {hasPublicPreview && previewLearnSearch ? (
            <Button asChild variant="link" size="sm" className="h-auto px-0 text-primary">
              <Link
                to="/courses/$slug/learn"
                params={{ slug: courseSlug }}
                search={previewLearnSearch}
                className="inline-flex items-center gap-1 text-sm font-semibold"
              >
                <Play className="size-3.5 fill-current" aria-hidden />
                {isFreeCourse({ price }) || scheduledSoon
                  ? "Voir la preview gratuite"
                  : "Preview gratuite avant achat"}
              </Link>
            </Button>
          ) : null}
        </>
      )}

      <p className="text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">{enrolledLabel}</span> déjà inscrits
      </p>
    </div>
  );
}
