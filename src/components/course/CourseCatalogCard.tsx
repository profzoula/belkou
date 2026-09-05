import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { CourseThumbnailBanner } from "@/components/course/CourseThumbnailBanner";
import { CourseScheduleBadge } from "@/components/course/CourseScheduleBadge";
import { getCourseCategoryLabel } from "@/lib/course-categories";
import { formatCount, isFreeCourse } from "@/lib/courses";
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

function PriceBlock({ course }: { course: PublicCourse }) {
  if (isFreeCourse(course)) {
    return <span className="font-bold text-foreground">Gratuit</span>;
  }
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="font-bold text-foreground">
        ${Number.isInteger(course.price) ? course.price : course.price.toFixed(2)}
      </span>
      {course.originalPrice > course.price ? (
        <span className="text-xs text-muted-foreground line-through">${course.originalPrice}</span>
      ) : null}
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
          "group flex overflow-hidden rounded-2xl border border-border bg-card transition-[border-color,box-shadow,opacity] duration-300 hover:border-primary/35 hover:shadow-md focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_#0056d2]",
          className,
        )}
      >
        <div className="relative w-40 shrink-0 bg-neutral-900 sm:w-52">
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

        <div className="flex min-w-0 flex-1 flex-col gap-2 p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {category}
          </p>
          <h2 className="line-clamp-2 text-base font-bold leading-snug text-foreground sm:text-lg">
            {course.title}
          </h2>
          <p className="line-clamp-2 text-sm text-muted-foreground">{course.description}</p>
          <p className="text-sm text-muted-foreground">{instructor}</p>
          <div className="mt-auto flex items-center justify-between gap-3 pt-2">
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-accent">
              {course.rating.toFixed(1)}
              <Star className="size-3.5 fill-brand-accent text-brand-accent" aria-hidden />
              <span className="font-normal text-muted-foreground">
                ({formatCount(course.ratingsCount)})
              </span>
            </span>
            <PriceBlock course={course} />
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
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-[border-color,box-shadow,opacity] duration-300 hover:border-primary/35 hover:shadow-md focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_#0056d2]",
        className,
      )}
    >
      <div className="relative bg-neutral-900">
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

      <div className="flex flex-1 flex-col gap-1.5 p-3.5 sm:p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {category}
        </p>
        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-foreground sm:text-[15px]">
          {course.title}
        </h3>
        <p className="text-xs text-muted-foreground sm:text-sm">{instructor}</p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-accent sm:text-sm">
            {course.rating.toFixed(1)}
            <Star className="size-3.5 fill-brand-accent text-brand-accent" aria-hidden />
          </span>
          <PriceBlock course={course} />
        </div>
      </div>
    </Link>
  );
}
