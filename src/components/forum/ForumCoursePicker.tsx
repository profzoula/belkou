import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { MessageSquarePlus, MessagesSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      <div className="rounded-lg border border-border bg-card p-10 text-center text-sm text-muted-foreground">
        Chargement des cours...
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-10 text-center">
        <MessagesSquare className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
        <h2 className="text-lg font-bold">Forum réservé aux inscrits</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
          Inscrivez-vous à un cours pour poser des questions et échanger avec les autres étudiants.
        </p>
        <Button asChild className="mt-6" variant="hero">
          <Link to="/courses">Explorer les cours</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {courses.map((course) => (
        <article key={course.courseSlug} className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
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
          <div className="p-4">
            <Link to="/forum/$courseSlug" params={{ courseSlug: course.courseSlug }}>
              <h2 className="font-bold text-sm leading-snug hover:text-primary">{course.courseTitle}</h2>
            </Link>
            <p className="mt-1 text-xs text-muted-foreground">{course.instructor}</p>
            <Button asChild size="sm" variant="soft" className="mt-4 w-full gap-2">
              <Link to="/forum/$courseSlug" params={{ courseSlug: course.courseSlug }}>
                <MessageSquarePlus className="h-4 w-4" />
                Ouvrir le forum
              </Link>
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}
