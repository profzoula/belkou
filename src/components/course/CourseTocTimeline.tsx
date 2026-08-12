import type { ReactNode } from "react";
import { BookOpen, Check, CheckCircle2, ChevronDown, Circle, ClipboardList, FileText, Lock, PlayCircle } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export type CourseTocMarkerStyle = "odin" | "timeline";

export function CourseTocPartHeader({
  partNumber,
  title,
  markerStyle = "timeline",
}: {
  partNumber: number;
  title: string;
  markerStyle?: CourseTocMarkerStyle;
}) {
  if (markerStyle === "odin") {
    return null;
  }

  return (
    <div className="course-toc-part-header border-y border-border/70 bg-slate-100/90 px-4 py-3 dark:bg-muted/35">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500 dark:text-muted-foreground">
        Partie {partNumber}
      </p>
      <p className="mt-0.5 text-sm font-bold leading-snug text-slate-900 dark:text-foreground">
        {title}
      </p>
    </div>
  );
}

type CourseTocSectionProps = {
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  completedCount: number;
  totalCount: number;
  summaryLabel?: string;
  children: ReactNode;
};

export function CourseTocCollapsibleSection({
  title,
  open,
  onOpenChange,
  completedCount,
  totalCount,
  summaryLabel,
  children,
}: CourseTocSectionProps) {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange} className="border-b border-border/60 last:border-b-0">
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-colors hover:bg-muted/40">
        <span className="min-w-0 flex-1 text-sm font-semibold leading-snug text-foreground">{title}</span>
        <span className="flex shrink-0 items-center gap-2">
          {summaryLabel ? (
            <span className="text-[11px] text-muted-foreground">{summaryLabel}</span>
          ) : totalCount > 0 ? (
            <span className="text-[11px] tabular-nums text-muted-foreground">
              {completedCount}/{totalCount}
            </span>
          ) : null}
          <ChevronDown
            className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")}
            aria-hidden
          />
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent>{children}</CollapsibleContent>
    </Collapsible>
  );
}

export type CourseTocRowState = "completed" | "active" | "upcoming" | "quiz" | "locked";

export type CourseTocContentType = "article" | "video" | "resource" | "quiz";

type CourseTocRowProps = {
  title: string;
  stepNumber?: number | null;
  state: CourseTocRowState;
  isQuiz?: boolean;
  contentType?: CourseTocContentType;
  disabled?: boolean;
  className?: string;
  markerStyle?: CourseTocMarkerStyle;
};

function TocContentIcon({
  contentType,
  state,
}: {
  contentType: CourseTocContentType;
  state: CourseTocRowState;
}) {
  const className = cn(
    "size-4 shrink-0",
    state === "active" ? "text-foreground" : "text-muted-foreground",
  );

  if (contentType === "video") {
    return <PlayCircle className={className} aria-hidden />;
  }

  if (contentType === "quiz") {
    return <ClipboardList className={className} aria-hidden />;
  }

  if (contentType === "resource") {
    return <FileText className={className} aria-hidden />;
  }

  return <BookOpen className={className} aria-hidden />;
}

function TocMarker({
  state,
  stepNumber,
  isQuiz = false,
  markerStyle = "odin",
}: {
  state: CourseTocRowState;
  stepNumber?: number | null;
  isQuiz?: boolean;
  markerStyle?: CourseTocMarkerStyle;
}) {
  if (markerStyle === "odin") {
    if (state === "locked") {
      return <Lock className="size-4 shrink-0 text-muted-foreground/70" aria-hidden />;
    }
    if (state === "completed") {
      return <CheckCircle2 className="size-[18px] shrink-0 fill-success text-white" aria-hidden />;
    }
    return (
      <Circle
        className={cn(
          "size-[18px] shrink-0",
          state === "active" ? "text-primary" : "text-muted-foreground/45",
        )}
        aria-hidden
      />
    );
  }

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
  contentType = "article",
  disabled = false,
  className,
  markerStyle = "odin",
}: CourseTocRowProps) {
  const isOdin = markerStyle === "odin";

  return (
    <div
      className={cn(
        "relative flex w-full items-center gap-2.5 text-left",
        isOdin ? "px-4 py-2.5" : "items-start gap-3 rounded-lg px-2 py-2.5",
        state === "active" && (isOdin ? "bg-muted/70" : "bg-primary/5"),
        disabled && "opacity-60",
        className,
      )}
    >
      <span className={cn("shrink-0", !isOdin && "relative z-[1] mt-0.5")}>
        <TocMarker
          state={state}
          stepNumber={stepNumber}
          isQuiz={isQuiz}
          markerStyle={markerStyle}
        />
      </span>
      {isOdin && state !== "locked" ? (
        <TocContentIcon contentType={isQuiz ? "quiz" : contentType} state={state} />
      ) : null}
      <span
        className={cn(
          "min-w-0 flex-1 leading-snug",
          isOdin ? "text-sm" : "pt-1 text-sm",
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
  markerStyle = "odin",
  children,
}: {
  isLast?: boolean;
  markerStyle?: CourseTocMarkerStyle;
  children: ReactNode;
}) {
  if (markerStyle === "odin") {
    return <li className="course-toc-item">{children}</li>;
  }

  return (
    <li className="course-toc-item relative pl-3">
      {!isLast ? (
        <span aria-hidden className="absolute left-[26px] top-8 bottom-0 w-px bg-border/90" />
      ) : null}
      {children}
    </li>
  );
}

type CourseTocItemProps = CourseTocRowProps & {
  isLast?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
  markerStyle?: CourseTocMarkerStyle;
};

export function CourseTocItem({
  title,
  stepNumber,
  state,
  isQuiz = false,
  contentType = "article",
  isLast = false,
  onClick,
  disabled = false,
  ariaLabel,
  markerStyle = "odin",
}: CourseTocItemProps) {
  return (
    <CourseTocItemShell isLast={isLast} markerStyle={markerStyle}>
      {onClick ? (
        <button
          type="button"
          disabled={disabled}
          onClick={onClick}
          aria-label={ariaLabel}
          aria-current={state === "active" ? "step" : undefined}
          className={cn(
            "w-full transition-colors",
            !disabled && markerStyle === "odin" && "hover:bg-muted/45",
            !disabled && markerStyle === "timeline" && "hover:bg-muted/45",
            disabled && "cursor-not-allowed",
          )}
        >
          <CourseTocRow
            title={title}
            stepNumber={stepNumber}
            state={state}
            isQuiz={isQuiz}
            contentType={contentType}
            disabled={disabled}
            markerStyle={markerStyle}
          />
        </button>
      ) : (
        <CourseTocRow
          title={title}
          stepNumber={stepNumber}
          state={state}
          isQuiz={isQuiz}
          contentType={contentType}
          disabled={disabled}
          markerStyle={markerStyle}
        />
      )}
    </CourseTocItemShell>
  );
}

export function CourseTocList({
  children,
  markerStyle = "odin",
}: {
  children: ReactNode;
  markerStyle?: CourseTocMarkerStyle;
}) {
  return (
    <ul
      className={cn(
        "course-toc-list",
        markerStyle === "odin" ? "space-y-0 py-1" : "space-y-0.5 px-2 py-3",
      )}
    >
      {children}
    </ul>
  );
}
