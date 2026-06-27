import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { SectionHeader } from "@/components/site/SectionHeader";
import { FaqAccordion } from "@/components/site/FAQ";
import { formatWhatsAppPhone, getWhatsAppChatUrl } from "@/lib/site-config";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/faq")({
  head: () =>
    seoHead({
      title: "FAQ — BelKou",
      description:
        "Questions fréquentes sur BelKou : inscription, paiement, cours gratuits, previews et accès aux formations en ligne.",
      path: "/faq",
    }),
  component: FaqPage,
});

function FaqPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="site-page-top site-container mx-auto max-w-3xl py-10 sm:py-14 md:py-16">
        <SectionHeader
          label="FAQ"
          title="Des questions ?"
          description="Tout ce qu'il faut savoir sur la plateforme BelKou et nos cours en ligne."
          className="mb-10"
        />

        <FaqAccordion />

        <p className="mt-10 text-center text-sm text-muted-foreground">
          Une autre question ?{" "}
          <Link to="/services" className="font-semibold text-primary hover:underline">
            Contactez-nous
          </Link>{" "}
          ou écrivez-nous sur{" "}
          <a
            href={getWhatsAppChatUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary hover:underline"
          >
            WhatsApp ({formatWhatsAppPhone()})
          </a>
          .
        </p>
      </main>
      <Footer />
    </div>
  );
}
