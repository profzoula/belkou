import { Check, ChevronLeft, ChevronRight, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LessonNavControlsProps = {
  canGoPrevious: boolean;
  canGoNext: boolean;
  canMarkComplete: boolean;
  isCompleted: boolean;
  previousTitle?: string;
  nextTitle?: string;
  onPrevious: () => void;
  onNext: () => void;
  onMarkComplete: () => void;
  className?: string;
};

export function LessonNavControls({
  canGoPrevious,
  canGoNext,
  canMarkComplete,
  isCompleted,
  previousTitle,
  nextTitle,
  onPrevious,
  onNext,
  onMarkComplete,
  className,
}: LessonNavControlsProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl"
          disabled={!canGoPrevious}
          onClick={onPrevious}
          aria-label={previousTitle ? `Leçon précédente : ${previousTitle}` : "Leçon précédente"}
        >
          <ChevronLeft className="size-4" aria-hidden />
          Précédent
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl"
          disabled={!canGoNext}
          onClick={onNext}
          aria-label={nextTitle ? `Leçon suivante : ${nextTitle}` : "Leçon suivante"}
        >
          Suivant
          <ChevronRight className="size-4" aria-hidden />
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant={isCompleted ? "soft" : "default"}
          className="rounded-xl"
          disabled={!canMarkComplete || isCompleted}
          onClick={onMarkComplete}
          aria-keyshortcuts="Alt+C"
          aria-label={isCompleted ? "Leçon déjà terminée" : "Marquer la leçon comme terminée"}
        >
          <Check className="size-4" aria-hidden />
          {isCompleted ? "Terminée" : "Marquer comme terminée"}
        </Button>
        <p className="hidden items-center gap-1.5 text-[11px] text-muted-foreground lg:inline-flex">
          <Keyboard className="size-3.5" aria-hidden />
          <span>
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
              ←
            </kbd>{" "}
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
              →
            </kbd>{" "}
            naviguer ·{" "}
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
              Alt + C
            </kbd>{" "}
            terminer
          </span>
        </p>
      </div>
    </div>
  );
}
