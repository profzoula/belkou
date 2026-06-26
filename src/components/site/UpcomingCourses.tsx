import { Link } from "@tanstack/react-router";
import { ArrowRight, CalendarClock, Play, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/site/SectionHeader";
import { CourseThumbnailBanner } from "@/components/course/CourseThumbnailBanner";
import { CourseScheduleBadge } from "@/components/course/CourseScheduleBadge";
import { formatCount, getFirstPreviewVideoLesson } from "@/lib/courses";
import { formatScheduledPublishLabel } from "@/lib/course-publish";
import type { PublicCourse } from "@/lib/fns/courses";

type UpcomingCoursesProps = {
  courses: PublicCourse[];
};

function UpcomingCourseCard({ course }: { course: PublicCourse }) {
  const hasPreview = Boolean(getFirstPreviewVideoLesson(course));

  return (
    <Link
      to="/courses/$slug"
      params={{ slug: course.slug }}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/20 hover:shadow-md"
    >
      <CourseThumbnailBanner
        thumbnail={course.thumbnail}
        slug={course.slug}
        aspectClass="aspect-[16/10]"
        showLabel={false}
        showIcon={false}
      >
        <CourseScheduleBadge scheduledPublishAt={course.scheduledPublishAt} variant="overlay" />
      </CourseThumbnailBanner>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-sm font-bold leading-snug group-hover:text-primary">{course.title}</h3>
        <p className="mt-1 truncate text-xs text-muted-foreground">{course.instructor}</p>

        <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-sky-800">
          <CalendarClock className="h-3.5 w-3.5 shrink-0" />
          {course.scheduledPublishAt
            ? `Lancement le ${formatScheduledPublishLabel(course.scheduledPublishAt)}`
            : "Bientôt disponible"}
        </p>

        {hasPreview ? (
          <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary">
            <Play className="h-3.5 w-3.5" />
            Preview gratuite disponible
          </p>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold">${course.price}</span>
            <span className="text-sm text-muted-foreground line-through">${course.originalPrice}</span>
          </div>
          <span className="inline-flex items-center gap-0.5 text-xs font-bold text-amber-600">
            {course.rating.toFixed(1)}
            <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
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
          description={`${formatCount(courses.length)} formation${courses.length > 1 ? "s" : ""} ouverte${courses.length > 1 ? "s" : ""} à l'inscription — preview gratuite dès maintenant, contenu complet à la date indiquée.`}
          align="left"
          className="mb-8 max-w-2xl"
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
