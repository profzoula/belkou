import { CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
      <Badge
        className={cn(
          "absolute left-3 top-3 z-10 gap-1 rounded-md border-transparent bg-primary/95 px-2.5 py-1 text-[10px] font-bold text-primary-foreground shadow-sm backdrop-blur-sm",
          className,
        )}
      >
        <CalendarClock className="h-3 w-3 shrink-0" aria-hidden />
        Disponible le {label}
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className={cn("gap-1 text-[10px] font-semibold", className)}>
      <CalendarClock className="h-3 w-3 shrink-0" aria-hidden />
      Disponible le {label}
    </Badge>
  );
}
