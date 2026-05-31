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

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BelKou — Apprenez à créer des Apps IA et des SaaS" },
      { name: "description", content: "Apprenez à utiliser les outils IA pour créer des sites web, des SaaS et des automatisations. Formation complète en français avec mentorat." },
      { property: "og:title", content: "BelKou" },
      { property: "og:description", content: "Formation BelKou — créez des Apps IA rapidement." },
      { property: "og:image", content: "/og-image.svg" },
    ],
  }),
  loader: () => getStudentCount(),
  component: Index,
});

function Index() {
  const studentCount = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-background">
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
