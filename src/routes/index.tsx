import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Hero } from "@/components/site/Hero";
import { CareerInvestSection } from "@/components/site/CareerInvestSection";
import { TrustStrip } from "@/components/site/TrustStrip";
import { CoursesSection } from "@/components/site/CoursesSection";
import { LiveEventsSection } from "@/components/site/LiveEventsSection";
import { ServicesSection } from "@/components/site/ServicesSection";
import { UpcomingCourses } from "@/components/site/UpcomingCourses";
import { HowItWorks } from "@/components/site/HowItWorks";
import { Testimonials } from "@/components/site/Testimonials";
import { CTA } from "@/components/site/CTA";
import { Footer } from "@/components/site/Footer";
import { VipUnlimitedCta } from "@/components/site/VipUnlimitedCta";
import { getStudentCount } from "@/lib/fns/stats";
import { getPublicCourseCategories, getPublicCourses } from "@/lib/fns/courses";
import { getPublicServices } from "@/lib/fns/services";
import { listPublicLiveSessions } from "@/lib/fns/live";
import { serializableToServiceItem } from "@/lib/service-storage";
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
    const [studentCount, publicCourses, categories, publicServices, liveSessions] =
      await Promise.all([
        getStudentCount(),
        getPublicCourses(),
        getPublicCourseCategories(),
        getPublicServices(),
        // The landing page must render even if the live system is having a bad day.
        listPublicLiveSessions().catch(() => []),
      ]);
    return {
      studentCount,
      courses: publicCourses,
      categories,
      services: publicServices,
      liveSessions,
    };
  },
  component: Index,
});

function Index() {
  const { studentCount, courses, categories, services, liveSessions } = Route.useLoaderData();

  const upcomingCourses = courses.filter((course) => isScheduledInFuture(course));
  const serviceItems = services.map(serializableToServiceItem);

  return (
    <div className="min-h-screen max-w-[100vw] overflow-x-hidden bg-background">
      <JsonLd data={[organizationJsonLd()]} />
      <div className="relative bg-background">
        <Navbar theme="hero" />
        <Hero studentCount={studentCount} />
      </div>
      <main id="main-content" className="max-w-full overflow-x-hidden">
        <CoursesSection courses={courses} categories={categories} />
        <LiveEventsSection sessions={liveSessions} />
        <TrustStrip />
        <ServicesSection services={serviceItems} />
        <VipUnlimitedCta />
        <UpcomingCourses courses={upcomingCourses} />
        <HowItWorks />
        <Testimonials />
        <CTA />
        <CareerInvestSection />
      </main>
      <Footer />
    </div>
  );
}
