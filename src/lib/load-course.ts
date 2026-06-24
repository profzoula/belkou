import { notFound } from "@tanstack/react-router";
import { getPublicCourse, type PublicCourse } from "@/lib/fns/courses";

export async function loadCoursePage(slug: string): Promise<PublicCourse> {
  const course = await getPublicCourse({ data: { slug } });
  if (!course) throw notFound();
  return course;
}
