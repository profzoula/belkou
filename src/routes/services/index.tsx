import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, BriefcaseBusiness, CalendarCheck, Sparkles } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FadeIn } from "@/components/motion/FadeIn";
import { ServiceCard } from "@/components/services/ServiceCard";
import { getPublicServices } from "@/lib/fns/services";
import { serializableToServiceItem, type SerializableService } from "@/lib/service-storage";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/services/")({
  head: () =>
    seoHead({
      title: "Services — BelKou",
      description:
        "Création LLC, développement web, marketing digital, déclaration fiscale et formations — solutions complètes pour votre business.",
      path: "/services",
    }),
  loader: async () => {
    const services = await getPublicServices();
    return { services };
  },
  component: ServicesIndexPage,
});

function ServicesIndexPage() {
  const { services: rawServices } = Route.useLoaderData() as { services: SerializableService[] };
  const services = rawServices.map(serializableToServiceItem);
  const contactSlug = services.find((service) => service.action.type === "booking")?.slug ?? services[0]?.slug;
  const displayedFrom = services[0]?.priceLabel ? `à partir de ${services[0].priceLabel}` : null;
  const contactHref = contactSlug ? `/services/${contactSlug}` : "/services";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <section className="relative overflow-hidden border-b border-border bg-gradient-mesh">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgb(0_70_213_/_0.14),transparent_58%)]"
          />
          <div className="site-container site-page-top relative grid gap-8 pb-10 pt-12 sm:pb-14 sm:pt-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.95fr)] lg:items-center">
            <FadeIn className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold tracking-[0.12em] text-primary uppercase">
                <Sparkles className="size-3.5" aria-hidden />
                Services BelKou
              </span>
              <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl">
                Solutions complètes pour votre business
              </h1>
              <p className="mt-4 text-muted-foreground md:text-lg">
                De la création d&apos;entreprise à la formation, nous couvrons vos besoins numériques avec
                un accompagnement concret.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={contactHref}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-primary transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Prendre rendez-vous
                  <ArrowRight className="size-4" aria-hidden />
                </a>
                <Link
                  to="/faq"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Voir les questions
                </Link>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <BadgeCheck className="size-4 text-primary" aria-hidden />
                  Devis personnalisé rapide
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarCheck className="size-4 text-primary" aria-hidden />
                  Support avant et après livraison
                </span>
              </div>
            </FadeIn>

            <FadeIn delay={0.06}>
              <div className="rounded-2xl border border-border/70 bg-card/95 p-5 shadow-sm backdrop-blur">
                <p className="text-sm font-semibold text-foreground">Pourquoi choisir nos services ?</p>
                <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <BriefcaseBusiness className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                    <span>{services.length} services actifs pour différents besoins business.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <BadgeCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                    <span>Process clair: brief, validation, exécution, suivi.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CalendarCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                    <span>Accompagnement humain par l&apos;équipe BelKou.</span>
                  </li>
                </ul>
                {displayedFrom ? (
                  <p className="mt-4 rounded-lg bg-primary/[0.06] px-3 py-2 text-sm font-medium text-primary">
                    Tarifs {displayedFrom}
                  </p>
                ) : null}
              </div>
            </FadeIn>
          </div>
        </section>

        <div className="site-container py-10 sm:py-14">
          {services.length === 0 ? (
            <p className="text-muted-foreground">Aucun service disponible pour le moment.</p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service, index) => (
                <FadeIn key={service.slug} delay={Math.min(index * 0.05, 0.2)}>
                  <ServiceCard service={service} />
                </FadeIn>
              ))}
            </div>
          )}

          {contactSlug ? (
            <p className="mt-12 text-center text-sm text-muted-foreground">
              Besoin d&apos;un service sur mesure ?{" "}
              <Link
                to="/services/$slug"
                params={{ slug: contactSlug }}
                className="font-semibold text-primary hover:underline"
              >
                Contactez-nous
              </Link>{" "}
              pour un devis personnalisé.
            </p>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
}
