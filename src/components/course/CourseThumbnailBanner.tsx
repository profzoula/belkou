import type { LucideIcon } from "lucide-react";
import { getCourseIcon } from "@/lib/course-icons";
import type { CourseThumbnailData } from "@/lib/course-thumbnails";
import { cn } from "@/lib/utils";

type CourseThumbnailBannerProps = {
  thumbnail: CourseThumbnailData;
  slug?: string;
  icon?: LucideIcon;
  className?: string;
  aspectClass?: string;
  showLabel?: boolean;
  showIcon?: boolean;
  labelClassName?: string;
  children?: React.ReactNode;
};

export function CourseThumbnailBanner({
  thumbnail,
  slug,
  icon,
  className,
  aspectClass = "aspect-[16/10]",
  showLabel = true,
  showIcon = true,
  labelClassName,
  children,
}: CourseThumbnailBannerProps) {
  const Icon = icon ?? (slug ? getCourseIcon(slug) : undefined);
  const label = showLabel && thumbnail.label ? (
    <span
      className={cn(
        "absolute left-3 top-3 z-10 rounded-md bg-black/35 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm",
        labelClassName,
      )}
    >
      {thumbnail.label}
    </span>
  ) : null;

  if (thumbnail.imageUrl?.trim()) {
    return (
      <div className={cn("relative overflow-hidden bg-muted", aspectClass, className)}>
        <img
          src={thumbnail.imageUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-black/20" />
        {label}
        {showIcon && Icon && (
          <Icon className="absolute right-3 top-3 z-10 h-8 w-8 text-white/30" aria-hidden />
        )}
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-gradient-to-br",
        thumbnail.gradient,
        aspectClass,
        className,
      )}
    >
      {showIcon && Icon && (
        <Icon className="absolute right-3 top-3 h-8 w-8 text-white/25 sm:h-10 sm:w-10" aria-hidden />
      )}
      {label}
      {children}
    </div>
  );
}
