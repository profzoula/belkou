import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Hero } from "@/components/site/Hero";
import { CareerInvestSection } from "@/components/site/CareerInvestSection";
import { TrustStrip } from "@/components/site/TrustStrip";
import { CoursesSection } from "@/components/site/CoursesSection";
import { ServicesSection } from "@/components/site/ServicesSection";
import { UpcomingCourses } from "@/components/site/UpcomingCourses";
import { HowItWorks } from "@/components/site/HowItWorks";
import { Testimonials } from "@/components/site/Testimonials";
import { CTA } from "@/components/site/CTA";
import { Footer } from "@/components/site/Footer";
import { VipUnlimitedCta } from "@/components/site/VipUnlimitedCta";
import { getStudentCount } from "@/lib/fns/stats";
import { getPublicCourses } from "@/lib/fns/courses";
import { getPublicServices } from "@/lib/fns/services";
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
    const [studentCount, publicCourses, publicServices] = await Promise.all([
      getStudentCount(),
      getPublicCourses(),
      getPublicServices(),
    ]);
    return {
      studentCount,
      courses: publicCourses,
      services: publicServices,
    };
  },
  component: Index,
});

function Index() {
  const { studentCount, courses, services } = Route.useLoaderData();

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
        <CareerInvestSection />
        <CoursesSection courses={courses} />
        <VipUnlimitedCta />
        <TrustStrip />
        <ServicesSection services={serviceItems} />
        <UpcomingCourses courses={upcomingCourses} />
        <HowItWorks />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
