import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Globe2, GraduationCap, Sparkles, Users } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { SectionHeader } from "@/components/site/SectionHeader";
import { FounderCard } from "@/components/site/FounderCard";
import { ImpactStats } from "@/components/site/ImpactStats";
import { Button } from "@/components/ui/button";
import { getCatalogCourseCount, getStudentCount } from "@/lib/fns/stats";
import { siteConfig } from "@/lib/site-config";
import { seoHead } from "@/lib/seo";

const pillars = [
  {
    icon: Sparkles,
    title: "Notre mission",
    description:
      "Rendre accessibles les compétences tech et l'IA à Haïti et à la diaspora — en français, avec des formations concrètes et applicables.",
  },
  {
    icon: GraduationCap,
    title: "Notre approche",
    description:
      "Des cours vidéo structurés, des previews gratuites et un accompagnement pour passer de l'idée au déploiement d'une vraie application.",
  },
  {
    icon: Users,
    title: "Notre communauté",
    description:
      "Un écosystème actif d'apprenants, de créateurs et de professionnels qui partagent, posent des questions et progressent ensemble.",
  },
] as const;

const commitments = [
  "Formations 100 % en français, pensées pour Haïti et la diaspora",
  "Preview gratuite avant achat sur chaque cours du catalogue",
  "Accès à vie au contenu acheté, avec progression sauvegardée",
  "Outils IA modernes : Cursor, Claude, déploiement et bonnes pratiques",
  "Paiements flexibles : Stripe, PayPal, MonCash, Zelle et virement",
] as const;

export const Route = createFileRoute("/about")({
  head: () =>
    seoHead({
      title: "À propos — BelKou",
      description:
        "Découvrez BelKou, la plateforme de formations IA & SaaS en français pour Haïti et la diaspora — et rencontrez son fondateur.",
      path: "/about",
    }),
  loader: async () => {
    const [studentCount, courseCount] = await Promise.all([
      getStudentCount(),
      getCatalogCourseCount(),
    ]);
    return { studentCount, courseCount };
  },
  component: AboutPage,
});

function AboutPage() {
  const { studentCount, courseCount } = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="site-page-top border-b border-border/60 bg-gradient-mesh">
        <div className="site-container mx-auto max-w-4xl py-12 sm:py-16 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="section-label mb-4 justify-center">À propos</p>
            <h1 className="font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl md:text-5xl">
              Former la nouvelle génération tech{" "}
              <span className="text-gradient">en français</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {siteConfig.name} est une plateforme de formations en ligne spécialisée en développement,
              applications IA et SaaS. Nous accompagnons les apprenants d'Haïti, de la diaspora et
              d'ailleurs pour créer, lancer et monétiser des projets numériques.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <span className="badge">
                <Globe2 className="h-3.5 w-3.5 text-primary" />
                {siteConfig.location}
              </span>
              <span className="badge">
                <span className="badge-dot" />
                {siteConfig.tagline}
              </span>
            </div>
          </div>
        </div>
      </section>

      <ImpactStats studentCount={studentCount} courseCount={courseCount} />

      <main>
        <section className="site-section-anchor py-14 sm:py-16 md:py-20">
          <div className="site-container">
            <SectionHeader
              label="Qui sommes-nous"
              title="Une plateforme née d'une vision claire"
              description="BelKou combine expertise technique, pédagogie et proximité communautaire pour offrir une expérience d'apprentissage professionnelle, accessible et orientée résultats."
              className="mb-12"
            />

            <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-3">
              {pillars.map((pillar) => (
                <article
                  key={pillar.title}
                  className="surface surface-hover rounded-2xl p-6 text-center md:text-left"
                >
                  <div className="icon-box mx-auto md:mx-0">
                    <pillar.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-bold">{pillar.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {pillar.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="site-section-anchor section-alt py-14 sm:py-16 md:py-20">
          <div className="site-container">
            <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-2 lg:gap-14">
              <div>
                <SectionHeader
                  label="Nos engagements"
                  title="Ce que vous obtenez avec BelKou"
                  description="Chaque formation est conçue pour être utile immédiatement — que vous débutiez ou que vous cherchiez à accélérer vos projets avec l'IA."
                  align="left"
                  className="mb-0 sm:mb-0"
                />
              </div>

              <ul className="space-y-3.5">
                {commitments.map((item) => (
                  <li
                    key={item}
                    className="surface flex items-start gap-3 rounded-xl px-4 py-3.5 text-sm"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Check className="h-3 w-3 text-primary" strokeWidth={2.5} />
                    </span>
                    <span className="text-foreground/90">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="site-section-anchor section-divider py-14 sm:py-16 md:py-20">
          <div className="site-container">
            <SectionHeader
              label="L'équipe"
              title="Rencontrez le fondateur"
              description="BelKou est administré par Mackenson Lundi (Prof Zoula), développeur et formateur passionné par la transmission des compétences tech à la communauté haïtienne."
              className="mb-10"
            />
            <FounderCard variant="featured" />
          </div>
        </section>

        <section className="pb-16 sm:pb-20 md:pb-24">
          <div className="site-container">
            <div className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl bg-gradient-brand p-8 text-center shadow-primary sm:p-10 md:p-12">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,oklch(1_0_0/0.15),transparent_50%)]" />
              <div className="relative">
                <h2 className="font-display text-2xl font-bold text-primary-foreground sm:text-3xl">
                  Prêt à commencer ?
                </h2>
                <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-primary-foreground/85 sm:text-base">
                  Explorez le catalogue, regardez une preview gratuite et rejoignez les milliers
                  d'apprenants qui construisent l'avenir avec BelKou.
                </p>
                <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Button
                    asChild
                    size="lg"
                    className="w-full touch-target bg-card text-foreground hover:bg-card/95 sm:w-auto"
                  >
                    <Link to="/courses">
                      Voir les cours <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="w-full touch-target border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 sm:w-auto"
                  >
                    <Link to="/signup">Créer un compte</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
