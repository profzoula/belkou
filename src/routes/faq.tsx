import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FadeIn } from "@/components/motion/FadeIn";
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
      <main>
        <section className="relative overflow-hidden border-b border-border bg-gradient-mesh">
          <div className="site-container site-page-top mx-auto max-w-3xl pb-10 pt-8 text-center sm:pb-14 sm:pt-12">
            <FadeIn>
              <p className="text-sm font-semibold tracking-[0.16em] text-primary uppercase">FAQ</p>
              <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Des questions ?
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground md:text-lg">
                Tout ce qu&apos;il faut savoir sur la plateforme BelKou et nos cours en ligne.
              </p>
            </FadeIn>
          </div>
        </section>

        <div className="site-container mx-auto max-w-3xl py-10 sm:py-14">
          <FadeIn delay={0.06}>
            <FaqAccordion />
          </FadeIn>

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
        </div>
      </main>
      <Footer />
    </div>
  );
}
