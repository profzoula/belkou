import type { ReactNode } from "react";
import { Check, ClipboardList, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export function CourseTocPartHeader({
  partNumber,
  title,
}: {
  partNumber: number;
  title: string;
}) {
  return (
    <div className="course-toc-part-header border-y border-border/70 bg-slate-100/90 px-4 py-3 dark:bg-muted/35">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500 dark:text-muted-foreground">
        Partie {partNumber}
      </p>
      <p className="mt-0.5 text-sm font-bold leading-snug text-slate-900 dark:text-foreground">{title}</p>
    </div>
  );
}

export type CourseTocRowState = "completed" | "active" | "upcoming" | "quiz" | "locked";

type CourseTocRowProps = {
  title: string;
  stepNumber?: number | null;
  state: CourseTocRowState;
  isQuiz?: boolean;
  disabled?: boolean;
  className?: string;
};

function TocMarker({
  state,
  stepNumber,
  isQuiz = false,
}: {
  state: CourseTocRowState;
  stepNumber?: number | null;
  isQuiz?: boolean;
}) {
  if (state === "completed") {
    return (
      <span className="grid size-7 place-items-center rounded-full bg-success text-white shadow-sm">
        <Check className="size-3.5 stroke-[2.75]" aria-hidden />
      </span>
    );
  }

  if (isQuiz) {
    return (
      <span
        className={cn(
          "grid size-7 place-items-center rounded-full border bg-card text-muted-foreground",
          state === "active" ? "border-primary text-primary" : "border-border",
        )}
      >
        <ClipboardList className="size-3.5" aria-hidden />
      </span>
    );
  }

  if (state === "locked") {
    return (
      <span className="grid size-7 place-items-center rounded-full border border-border bg-muted/40 text-muted-foreground">
        <Lock className="size-3.5" aria-hidden />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "grid size-7 place-items-center rounded-full border text-[11px] font-semibold tabular-nums",
        state === "active"
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground",
      )}
    >
      {stepNumber ?? "·"}
    </span>
  );
}

export function CourseTocRow({
  title,
  stepNumber,
  state,
  isQuiz = false,
  disabled = false,
  className,
}: CourseTocRowProps) {
  return (
    <div
      className={cn(
        "relative flex w-full items-start gap-3 rounded-lg px-2 py-2.5 text-left",
        state === "active" && "bg-primary/5",
        disabled && "opacity-60",
        className,
      )}
    >
      <span className="relative z-[1] mt-0.5 shrink-0">
        <TocMarker state={state} stepNumber={stepNumber} isQuiz={isQuiz} />
      </span>
      <span
        className={cn(
          "min-w-0 flex-1 pt-1 text-sm leading-snug",
          state === "active"
            ? "font-semibold text-foreground"
            : state === "completed"
              ? "text-muted-foreground"
              : "text-foreground/85",
          disabled && "text-muted-foreground",
        )}
      >
        {title}
      </span>
    </div>
  );
}

export function CourseTocItemShell({
  isLast = false,
  children,
}: {
  isLast?: boolean;
  children: ReactNode;
}) {
  return (
    <li className="course-toc-item relative pl-3">
      {!isLast ? (
        <span
          aria-hidden
          className="absolute left-[26px] top-8 bottom-0 w-px bg-border/90"
        />
      ) : null}
      {children}
    </li>
  );
}

type CourseTocItemProps = CourseTocRowProps & {
  isLast?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
};

export function CourseTocItem({
  title,
  stepNumber,
  state,
  isQuiz = false,
  isLast = false,
  onClick,
  disabled = false,
  ariaLabel,
}: CourseTocItemProps) {
  return (
    <CourseTocItemShell isLast={isLast}>
      {onClick ? (
        <button
          type="button"
          disabled={disabled}
          onClick={onClick}
          aria-label={ariaLabel}
          aria-current={state === "active" ? "step" : undefined}
          className={cn(
            "w-full transition-colors",
            !disabled && "hover:bg-muted/45",
            disabled && "cursor-not-allowed",
          )}
        >
          <CourseTocRow
            title={title}
            stepNumber={stepNumber}
            state={state}
            isQuiz={isQuiz}
            disabled={disabled}
          />
        </button>
      ) : (
        <CourseTocRow
          title={title}
          stepNumber={stepNumber}
          state={state}
          isQuiz={isQuiz}
          disabled={disabled}
        />
      )}
    </CourseTocItemShell>
  );
}

export function CourseTocList({ children }: { children: ReactNode }) {
  return <ul className="course-toc-list space-y-0.5 px-2 py-3">{children}</ul>;
}
