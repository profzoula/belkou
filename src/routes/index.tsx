import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Hero } from "@/components/site/Hero";
import { Features } from "@/components/site/Features";
import { Learn } from "@/components/site/Learn";
import { Pricing } from "@/components/site/Pricing";
import { Testimonials } from "@/components/site/Testimonials";
import { FAQ } from "@/components/site/FAQ";
import { CTA } from "@/components/site/CTA";
import { Footer } from "@/components/site/Footer";
import { getStudentCount } from "@/lib/fns/stats";
import { seoHead, defaultTitle, defaultDescription, courseJsonLd, organizationJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/site/JsonLd";

export const Route = createFileRoute("/")({
  head: () =>
    seoHead({
      title: defaultTitle,
      description: defaultDescription,
      path: "/",
    }),
  loader: () => getStudentCount(),
  component: Index,
});

function Index() {
  const studentCount = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={[organizationJsonLd(), courseJsonLd()]} />
      <Navbar />
      <main>
        <Hero studentCount={studentCount} />
        <Features />
        <Learn />
        <Pricing />
        <Testimonials />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
