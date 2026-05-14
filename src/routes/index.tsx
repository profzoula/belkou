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

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VibeCoding Formation — Apprenez à créer des Apps IA et des SaaS" },
      { name: "description", content: "Apprenez à utiliser les outils IA pour créer des sites web, des SaaS et des automations. Formation complète en français avec mentorat." },
      { property: "og:title", content: "VibeCoding Formation" },
      { property: "og:description", content: "Apprenez VibeCoding & créez des Apps IA rapidement." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero />
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
