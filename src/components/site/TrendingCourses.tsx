import { Link } from "@tanstack/react-router";
import { ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { SectionHeader } from "@/components/site/SectionHeader";
import { CourseThumbnailBanner } from "@/components/course/CourseThumbnailBanner";
import { formatCount } from "@/lib/courses";
import type { PublicCourse } from "@/lib/fns/courses";

type TrendingCoursesProps = {
  courses: PublicCourse[];
};

function CourseCard({ course }: { course: PublicCourse }) {
  return (
    <Link
      to="/courses/$slug"
      params={{ slug: course.slug }}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-md hover:border-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <CourseThumbnailBanner
        thumbnail={course.thumbnail}
        slug={course.slug}
        className="flex items-center justify-center p-4"
        showLabel={false}
        showIcon={false}
      />

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <h3 className="line-clamp-2 min-h-[2.75rem] text-sm font-bold leading-snug text-foreground group-hover:text-primary">
          {course.title}
        </h3>
        <p className="mt-1 truncate text-xs text-muted-foreground">{course.instructor}</p>

        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          {course.bestseller && (
            <span className="rounded-sm bg-teal-800 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              Bestseller
            </span>
          )}
          <span className="text-[10px] rounded-full bg-muted px-1.5 py-0.5 font-medium text-muted-foreground">
            {course.skillLevel}
          </span>
          <span className="inline-flex items-center gap-0.5 text-xs font-bold text-amber-600 dark:text-amber-400">
            {course.rating.toFixed(1)}
            <Star className="h-3 w-3 fill-amber-500 text-amber-500" aria-hidden />
          </span>
          <span className="text-xs text-muted-foreground">({formatCount(course.ratingsCount)})</span>
        </div>

        <div className="mt-auto flex items-baseline gap-2 pt-3">
          <span className="text-base font-bold">${course.price}</span>
          <span className="text-sm text-muted-foreground line-through">${course.originalPrice}</span>
        </div>
      </div>
    </Link>
  );
}

export function TrendingCourses({ courses }: TrendingCoursesProps) {
  if (courses.length === 0) return null;

  return (
    <section id="courses" className="site-section-anchor section-divider py-16 sm:py-20 md:py-28">
      <div className="site-container">
        <Carousel
          opts={{
            align: "start",
            dragFree: true,
          }}
          className="w-full"
        >
          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <SectionHeader
              label="Catalogue"
              title="Cours populaires"
              description="Formations en vidéo pour créer, déployer et monétiser — avec preview gratuite."
              align="left"
              className="mb-0 sm:mb-0 max-w-xl"
            />
            <div className="hidden shrink-0 items-center gap-2 sm:flex">
              <CarouselPrevious className="static translate-y-0" />
              <CarouselNext className="static translate-y-0" />
            </div>
          </div>

          <p className="mb-4 text-[11px] text-muted-foreground sm:hidden">Glissez pour voir les cours →</p>

          <CarouselContent className="-ml-3 sm:-ml-4">
            {courses.map((course) => (
              <CarouselItem
                key={course.slug}
                className="basis-[85vw] pl-3 sm:basis-1/2 sm:pl-4 md:basis-1/3 lg:basis-1/4"
              >
                <CourseCard course={course} />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        <div className="mt-8 flex justify-center sm:mt-10">
          <Button asChild variant="outline" className="rounded-full touch-target">
            <Link to="/courses">
              Voir tous les cours
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
