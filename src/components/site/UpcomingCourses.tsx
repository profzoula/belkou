import { Link } from "@tanstack/react-router";
import { ArrowRight, CalendarClock, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/site/SectionHeader";
import { CourseThumbnailBanner } from "@/components/course/CourseThumbnailBanner";
import { CourseScheduleBadge } from "@/components/course/CourseScheduleBadge";
import { SiteLogoMark } from "@/components/site/SiteLogoMark";
import { getCourseCategoryLabel } from "@/lib/course-categories";
import { formatCount, getFirstPreviewVideoLesson } from "@/lib/courses";
import { formatScheduledPublishLabel } from "@/lib/course-publish";
import type { PublicCourse } from "@/lib/fns/courses";

type UpcomingCoursesProps = {
  courses: PublicCourse[];
};

function displayInstructor(name: string) {
  const parts = name
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return parts[parts.length - 1] ?? name;
}

function UpcomingCourseCard({ course }: { course: PublicCourse }) {
  const hasPreview = Boolean(getFirstPreviewVideoLesson(course));
  const instructor = displayInstructor(course.instructor);
  const category = course.categories?.[0]
    ? getCourseCategoryLabel(course.categories[0])
    : "À venir";

  return (
    <Link
      to="/courses/$slug"
      params={{ slug: course.slug }}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative bg-neutral-950">
        <CourseThumbnailBanner
          thumbnail={course.thumbnail}
          slug={course.slug}
          aspectClass="aspect-[4/3]"
          className="rounded-none border-0"
          showLabel={false}
          showIcon={false}
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

        <p className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
          <CalendarClock className="size-3.5 shrink-0" aria-hidden />
          {course.scheduledPublishAt
            ? `Lancement le ${formatScheduledPublishLabel(course.scheduledPublishAt)}`
            : "Bientôt disponible"}
        </p>

        {hasPreview ? (
          <p className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
            <Play className="size-3.5" aria-hidden />
            Preview gratuite disponible
          </p>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-3 pt-1">
          <div className="flex min-w-0 items-center gap-2">
            <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
              <SiteLogoMark className="size-3.5" />
            </span>
            <span className="truncate text-xs text-muted-foreground sm:text-sm">{instructor}</span>
          </div>
          <span className="inline-flex max-w-[45%] shrink-0 truncate rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[10px] font-medium text-muted-foreground sm:text-[11px]">
            {category}
          </span>
        </div>

        <div className="flex items-baseline justify-between gap-2 border-t border-border/70 pt-3">
          <span className="inline-flex items-baseline gap-1.5">
            <span className="text-sm font-semibold text-foreground sm:text-base">${course.price}</span>
            {course.originalPrice > course.price ? (
              <span className="text-xs text-muted-foreground line-through">
                ${course.originalPrice}
              </span>
            ) : null}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function UpcomingCourses({ courses }: UpcomingCoursesProps) {
  if (courses.length === 0) return null;

  return (
    <section id="upcoming" className="site-section-anchor section-alt py-16 sm:py-20 md:py-24">
      <div className="site-container">
        <SectionHeader
          label="À venir"
          title="Prochains lancements"
          description={`${formatCount(courses.length)} formation${courses.length > 1 ? "s" : ""} ouverte${courses.length > 1 ? "s" : ""} à l'inscription. Preview gratuite dès maintenant, contenu complet à la date indiquée.`}
          align="left"
          className="mb-8 max-w-2xl"
        />

        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
          {courses.map((course) => (
            <UpcomingCourseCard key={course.slug} course={course} />
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <Button asChild variant="outline" className="rounded-full touch-target">
            <Link to="/courses">
              Voir tout le catalogue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
