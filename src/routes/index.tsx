import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Hero } from "@/components/site/Hero";
import { TrendingCourses } from "@/components/site/TrendingCourses";
import { UpcomingCourses } from "@/components/site/UpcomingCourses";
import { CourseCategories } from "@/components/site/CourseCategories";
import { PlatformBenefits } from "@/components/site/PlatformBenefits";
import { HowItWorks } from "@/components/site/HowItWorks";
import { FAQ } from "@/components/site/FAQ";
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
    const [studentCount, publicCourses] = await Promise.all([getStudentCount(), getPublicCourses()]);
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
    <div className="min-h-screen bg-background overflow-x-hidden max-w-[100vw]">
      <JsonLd data={[organizationJsonLd()]} />
      <Navbar />
      <main className="overflow-x-hidden max-w-full">
        <Hero studentCount={studentCount} courses={courses} />
        <TrendingCourses courses={courses} />
        <UpcomingCourses courses={upcomingCourses} />
        <CourseCategories courseCount={courses.length} />
        <PlatformBenefits />
        <HowItWorks />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
