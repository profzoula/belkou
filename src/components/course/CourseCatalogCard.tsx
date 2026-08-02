import { Link } from "@tanstack/react-router";
import { Clock3, Star, Users } from "lucide-react";
import { CourseThumbnailBanner } from "@/components/course/CourseThumbnailBanner";
import { CourseScheduleBadge } from "@/components/course/CourseScheduleBadge";
import { formatCount, isFreeCourse } from "@/lib/courses";
import type { PublicCourse } from "@/lib/fns/courses";
import { cn } from "@/lib/utils";

type CourseCatalogCardProps = {
  course: PublicCourse;
  layout?: "grid" | "row";
  className?: string;
};

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-sm font-bold text-foreground">{rating.toFixed(1)}</span>
      <div className="flex items-center gap-0.5" aria-hidden>
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            className={cn(
              "h-3.5 w-3.5",
              index < Math.round(rating)
                ? "fill-brand-accent text-brand-accent"
                : "fill-muted text-muted",
            )}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">({formatCount(count)})</span>
    </div>
  );
}

export function CourseCatalogCard({
  course,
  layout = "grid",
  className,
}: CourseCatalogCardProps) {
  const free = isFreeCourse(course);

  if (layout === "row") {
    return (
      <Link
        to="/courses/$slug"
        params={{ slug: course.slug }}
        className={cn(
          "group flex overflow-hidden rounded-2xl border border-border bg-card transition-all duration-200 hover:border-primary/25 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
      >
        <CourseThumbnailBanner
          thumbnail={course.thumbnail}
          slug={course.slug}
          aspectClass="aspect-auto w-36 sm:w-48 min-h-full"
          className="shrink-0 rounded-none border-0"
          showLabel={false}
          showIcon={false}
        >
          <CourseScheduleBadge scheduledPublishAt={course.scheduledPublishAt} variant="overlay" />
        </CourseThumbnailBanner>
        <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
          <h2 className="line-clamp-2 font-display text-base font-semibold leading-snug group-hover:text-primary sm:text-lg">
            {course.title}
          </h2>
          <p className="mt-1 truncate text-xs text-muted-foreground">{course.instructor}</p>
          <div className="mt-2">
            <CourseScheduleBadge scheduledPublishAt={course.scheduledPublishAt} />
          </div>
          <div className="mt-2">
            <StarRating rating={course.rating} count={course.ratingsCount} />
          </div>
          <div className="mt-auto flex flex-wrap items-center gap-3 pt-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock3 className="h-3.5 w-3.5" />
              {course.totalDuration}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {formatCount(course.studentsCount)}
            </span>
            <span className="ml-auto text-base font-bold text-foreground">
              {free ? (
                <span className="text-success">Gratuit</span>
              ) : (
                <>
                  ${course.price}
                  {course.originalPrice > course.price ? (
                    <span className="ml-2 text-sm font-normal text-muted-foreground line-through">
                      ${course.originalPrice}
                    </span>
                  ) : null}
                </>
              )}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to="/courses/$slug"
      params={{ slug: course.slug }}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <div className="relative">
        <CourseThumbnailBanner
          thumbnail={course.thumbnail}
          slug={course.slug}
          aspectClass="aspect-[16/10]"
          className="rounded-none border-0"
          showLabel={false}
          showIcon={!course.thumbnail.imageUrl}
        >
          <CourseScheduleBadge scheduledPublishAt={course.scheduledPublishAt} variant="overlay" />
        </CourseThumbnailBanner>
        {free ? (
          <span className="absolute left-2 top-2 z-10 rounded-md bg-success px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-success-foreground shadow-sm sm:left-3 sm:top-3 sm:px-2 sm:text-[10px]">
            Gratuit
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-2.5 sm:p-5">
        <h3 className="line-clamp-2 min-h-[2.4rem] font-display text-xs font-semibold leading-snug text-foreground group-hover:text-primary sm:min-h-[2.75rem] sm:text-base">
          {course.title}
        </h3>
        <p className="mt-1 truncate text-[10px] text-muted-foreground sm:text-xs">{course.instructor}</p>
        <div className="mt-2 hidden sm:mt-3 sm:block">
          <StarRating rating={course.rating} count={course.ratingsCount} />
        </div>
        <div className="mt-auto flex items-end justify-between gap-1.5 pt-2.5 sm:gap-3 sm:pt-4">
          <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground sm:gap-1 sm:text-xs">
            <Clock3 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            {course.totalDuration}
          </span>
          {free ? (
            <span className="text-sm font-bold text-success sm:text-lg">Gratuit</span>
          ) : (
            <span className="text-sm font-bold text-foreground sm:text-lg">
              ${Number.isInteger(course.price) ? course.price : course.price.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
