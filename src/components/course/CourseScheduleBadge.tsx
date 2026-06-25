import { CalendarClock } from "lucide-react";
import { formatScheduledPublishLabel, isScheduledInFuture } from "@/lib/course-publish";
import { cn } from "@/lib/utils";

type CourseScheduleBadgeProps = {
  scheduledPublishAt?: string;
  className?: string;
  variant?: "pill" | "overlay";
};

export function CourseScheduleBadge({
  scheduledPublishAt,
  className,
  variant = "pill",
}: CourseScheduleBadgeProps) {
  if (!scheduledPublishAt || !isScheduledInFuture({ scheduledPublishAt })) {
    return null;
  }

  const label = formatScheduledPublishLabel(scheduledPublishAt);

  if (variant === "overlay") {
    return (
      <span
        className={cn(
          "absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-md bg-sky-600/95 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm backdrop-blur-sm",
          className,
        )}
      >
        <CalendarClock className="h-3 w-3 shrink-0" aria-hidden />
        Disponible le {label}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-0.5 text-[10px] font-semibold text-sky-800 dark:bg-sky-900/40 dark:text-sky-200",
        className,
      )}
    >
      <CalendarClock className="h-3 w-3 shrink-0" aria-hidden />
      Disponible le {label}
    </span>
  );
}
