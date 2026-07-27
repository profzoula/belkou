import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, MessageSquarePlus, MessagesSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion/FadeIn";
import { CourseThumbnailBanner } from "@/components/course/CourseThumbnailBanner";
import { listForumCourses } from "@/lib/fns/forum";
import { useAuth } from "@/hooks/use-auth";

type ForumCourse = {
  courseSlug: string;
  courseTitle: string;
  instructor: string;
  thumbnailGradient: string;
  thumbnailImageUrl?: string;
};

export function ForumCoursePicker() {
  const { session } = useAuth();
  const listFn = useServerFn(listForumCourses);
  const [courses, setCourses] = useState<ForumCourse[] | undefined>(undefined);

  useEffect(() => {
    if (!session?.access_token) return;
    void listFn({ data: { accessToken: session.access_token } })
      .then((result) => setCourses(result))
      .catch(() => setCourses([]));
  }, [listFn, session?.access_token]);

  if (courses === undefined) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground shadow-sm">
        Chargement des cours…
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10">
          <MessagesSquare className="h-7 w-7 text-primary" />
        </div>
        <h2 className="font-display text-lg font-semibold">Forum réservé aux inscrits</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Inscrivez-vous à un cours pour poser des questions et échanger avec les autres étudiants.
        </p>
        <Button asChild className="mt-6 shadow-primary" variant="hero">
          <Link to="/courses">
            Explorer les cours
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {courses.map((course, index) => (
        <FadeIn key={course.courseSlug} delay={Math.min(index * 0.05, 0.2)}>
          <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md">
            <Link to="/forum/$courseSlug" params={{ courseSlug: course.courseSlug }}>
              <CourseThumbnailBanner
                thumbnail={{
                  gradient: course.thumbnailGradient,
                  label: "",
                  imageUrl: course.thumbnailImageUrl,
                }}
                slug={course.courseSlug}
                aspectClass="aspect-[16/10]"
                className="rounded-none border-0"
                showLabel={false}
                showIcon={!course.thumbnailImageUrl}
              />
            </Link>
            <div className="flex flex-1 flex-col p-4">
              <Link to="/forum/$courseSlug" params={{ courseSlug: course.courseSlug }}>
                <h2 className="font-display text-sm font-semibold leading-snug group-hover:text-primary">
                  {course.courseTitle}
                </h2>
              </Link>
              <p className="mt-1 text-xs text-muted-foreground">{course.instructor}</p>
              <div className="mt-auto pt-4">
                <Button asChild size="sm" variant="soft" className="w-full gap-2">
                  <Link to="/forum/$courseSlug" params={{ courseSlug: course.courseSlug }}>
                    <MessageSquarePlus className="h-4 w-4" />
                    Ouvrir le forum
                  </Link>
                </Button>
              </div>
            </div>
          </article>
        </FadeIn>
      ))}
    </div>
  );
}
