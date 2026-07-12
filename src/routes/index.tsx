import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Hero } from "@/components/site/Hero";
import { ImpactStats } from "@/components/site/ImpactStats";
import { TrendingCourses } from "@/components/site/TrendingCourses";
import { UpcomingCourses } from "@/components/site/UpcomingCourses";
import { HowItWorks } from "@/components/site/HowItWorks";
import { Testimonials } from "@/components/site/Testimonials";
import { CTA } from "@/components/site/CTA";
import { Footer } from "@/components/site/Footer";
import { getStudentCount, getCatalogCourseCount } from "@/lib/fns/stats";
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
    const [studentCount, publicCourses, courseCount] = await Promise.all([
      getStudentCount(),
      getPublicCourses(),
      getCatalogCourseCount(),
    ]);
    return {
      studentCount,
      courses: publicCourses,
      courseCount,
    };
  },
  component: Index,
});

function Index() {
  const { studentCount, courses, courseCount } = Route.useLoaderData();

  const upcomingCourses = courses.filter((course) => isScheduledInFuture(course));

  return (
    <div className="min-h-screen bg-background overflow-x-hidden max-w-[100vw]">
      <JsonLd data={[organizationJsonLd()]} />
      <div className="relative bg-background">
        <Navbar theme="hero" />
        <Hero studentCount={studentCount} />
        <ImpactStats studentCount={studentCount} courseCount={courseCount} overlap />
      </div>
      <main className="overflow-x-hidden max-w-full">
        <TrendingCourses courses={courses} />
        <UpcomingCourses courses={upcomingCourses} />
        <HowItWorks />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
