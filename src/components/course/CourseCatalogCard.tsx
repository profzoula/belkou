import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { CourseThumbnailBanner } from "@/components/course/CourseThumbnailBanner";
import { CourseScheduleBadge } from "@/components/course/CourseScheduleBadge";
import { SiteLogoMark } from "@/components/site/SiteLogoMark";
import { getCourseCategoryLabel } from "@/lib/course-categories";
import { isFreeCourse } from "@/lib/courses";
import type { PublicCourse } from "@/lib/fns/courses";
import { cn } from "@/lib/utils";

type CourseCatalogCardProps = {
  course: PublicCourse;
  layout?: "grid" | "row";
  className?: string;
};

function displayInstructor(name: string) {
  const parts = name
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return parts[parts.length - 1] ?? name;
}

function courseCategoryLabel(course: PublicCourse) {
  const id = course.categories?.[0];
  return id ? getCourseCategoryLabel(id) : "Formation";
}

function PriceBlock({ course, className }: { course: PublicCourse; className?: string }) {
  const free = isFreeCourse(course);
  if (free) {
    return <span className={cn("font-semibold text-success", className)}>Gratuit</span>;
  }
  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-1.5", className)}>
      <span className="font-semibold text-foreground">
        ${Number.isInteger(course.price) ? course.price : course.price.toFixed(2)}
      </span>
      {course.originalPrice > course.price ? (
        <span className="text-xs text-muted-foreground line-through">${course.originalPrice}</span>
      ) : null}
    </span>
  );
}

function AuthorMark() {
  return (
    <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
      <SiteLogoMark className="size-3.5" />
    </span>
  );
}

export function CourseCatalogCard({ course, layout = "grid", className }: CourseCatalogCardProps) {
  const instructor = displayInstructor(course.instructor);
  const category = courseCategoryLabel(course);

  if (layout === "row") {
    return (
      <Link
        to="/courses/$slug"
        params={{ slug: course.slug }}
        className={cn(
          "group flex overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
      >
        <div className="relative w-36 shrink-0 bg-neutral-950 sm:w-48">
          <CourseThumbnailBanner
            thumbnail={course.thumbnail}
            slug={course.slug}
            aspectClass="aspect-auto min-h-full w-full"
            className="rounded-none border-0"
            showLabel={false}
            showIcon={false}
            showOverlay={false}
          >
            <CourseScheduleBadge scheduledPublishAt={course.scheduledPublishAt} variant="overlay" />
          </CourseThumbnailBanner>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 sm:p-5">
          <div className="min-w-0">
            <h2 className="line-clamp-2 font-display text-base font-semibold leading-snug tracking-tight text-foreground sm:text-lg">
              {course.title}
            </h2>
            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {course.description}
            </p>
          </div>

          <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <AuthorMark />
              <span className="truncate text-sm text-muted-foreground">{instructor}</span>
            </div>
            <span className="inline-flex max-w-full truncate rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
              {category}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-3">
            <PriceBlock course={course} className="text-base" />
            <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground">
              {course.rating.toFixed(1)}
              <Star className="size-3.5 fill-brand-accent text-brand-accent" aria-hidden />
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
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <div className="relative bg-neutral-950">
        <CourseThumbnailBanner
          thumbnail={course.thumbnail}
          slug={course.slug}
          aspectClass="aspect-[4/3]"
          className="rounded-none border-0"
          showLabel={false}
          showIcon={!course.thumbnail.imageUrl}
          showOverlay={false}
        >
          <CourseScheduleBadge scheduledPublishAt={course.scheduledPublishAt} variant="overlay" />
        </CourseThumbnailBanner>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="min-w-0">
          <h3 className="line-clamp-2 font-display text-sm font-semibold leading-snug tracking-tight text-foreground sm:text-[15px]">
            {course.title}
          </h3>
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
            {course.description}
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-1">
          <div className="flex min-w-0 items-center gap-2">
            <AuthorMark />
            <span className="truncate text-xs text-muted-foreground sm:text-sm">{instructor}</span>
          </div>
          <span className="inline-flex max-w-[45%] shrink-0 truncate rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[10px] font-medium text-muted-foreground sm:text-[11px]">
            {category}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border/70 pt-3">
          <PriceBlock course={course} className="text-sm sm:text-base" />
          <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground sm:text-sm">
            {course.rating.toFixed(1)}
            <Star className="size-3.5 fill-brand-accent text-brand-accent" aria-hidden />
          </span>
        </div>
      </div>
    </Link>
  );
}
