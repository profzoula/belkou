import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Hero } from "@/components/site/Hero";
import { TrustStrip } from "@/components/site/TrustStrip";
import { CoursesSection } from "@/components/site/CoursesSection";
import { UpcomingCourses } from "@/components/site/UpcomingCourses";
import { HowItWorks } from "@/components/site/HowItWorks";
import { Testimonials } from "@/components/site/Testimonials";
import { CTA } from "@/components/site/CTA";
import { Footer } from "@/components/site/Footer";
import { getStudentCount } from "@/lib/fns/stats";
import { getPublicCourses } from "@/lib/fns/courses";
import { isScheduledInFuture } from "@/lib/course-publish";
import { seoHead, defaultTitle, defaultDescription, organizationJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/site/JsonLd";

export const Route = createFileRoute("/")({
  head: () =>
    seoHead({
      title: defaultTitle,
      description: defaultDescription,
      path: "/",
    }),
  loader: async () => {
    const [studentCount, publicCourses] = await Promise.all([
      getStudentCount(),
      getPublicCourses(),
    ]);
    return {
      studentCount,
      courses: publicCourses,
    };
  },
  component: Index,
});

function Index() {
  const { studentCount, courses } = Route.useLoaderData();

  const upcomingCourses = courses.filter((course) => isScheduledInFuture(course));

  return (
    <div className="min-h-screen max-w-[100vw] overflow-x-hidden bg-background">
      <JsonLd data={[organizationJsonLd()]} />
      <div className="relative bg-background">
        <Navbar theme="hero" />
        <Hero studentCount={studentCount} />
      </div>
      <main className="max-w-full overflow-x-hidden">
        <CoursesSection courses={courses} />
        <TrustStrip />
        <UpcomingCourses courses={upcomingCourses} />
        <HowItWorks />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
