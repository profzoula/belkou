import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { SectionHeader } from "@/components/site/SectionHeader";
import { FounderCard } from "@/components/site/FounderCard";
import { siteConfig } from "@/lib/site-config";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/about")({
  head: () =>
    seoHead({
      title: "À propos — BelKou",
      description:
        "Découvrez BelKou, la plateforme de formations IA & SaaS en français pour Haïti et la diaspora — et rencontrez son fondateur.",
      path: "/about",
    }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="site-page-top site-container mx-auto max-w-3xl py-10 sm:py-14 md:py-16">
        <SectionHeader
          label="À propos"
          title="Qui sommes-nous ?"
          description={`${siteConfig.name} sey yon platfòm fòmasyon an franse pou aprann kreye apps IA, SaaS ak pwojè sou entènèt — pou Ayiti, dyaspora a ak tout moun ki vle avanse.`}
          className="mb-12"
        />

        <div className="mb-12 space-y-4 text-center text-sm leading-relaxed text-muted-foreground sm:text-base">
          <p>
            Nou kwè tout moun merite aksè a fòmasyon tech modèn, pratik, ak zouti IA ki mache vrèman nan
            lavi pwofesyonèl ou. Sou {siteConfig.name}, ou jwenn kou videyo, preview gratis, kominote aktif,
            ak sipò pou pase de ide rive nan lansman.
          </p>
          <p>
            Platfòm la administre pa ekip ki konbine eksperyans devlopman, edikasyon, ak misyon pou
            demokratize teknoloji an franse.
          </p>
        </div>

        <div className="mb-6 text-center">
          <p className="section-label mb-6 justify-center">Administrateur</p>
          <FounderCard />
        </div>
      </main>
      <Footer />
    </div>
  );
}
