import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FadeIn } from "@/components/motion/FadeIn";
import { ServiceCard } from "@/components/services/ServiceCard";
import { getPublicServices } from "@/lib/fns/services";
import { serializableToServiceItem } from "@/lib/service-storage";
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
    return { services: services.map(serializableToServiceItem) };
  },
  component: ServicesIndexPage,
});

function ServicesIndexPage() {
  const { services } = Route.useLoaderData();
  const contactSlug = services.find((service) => service.action.type === "booking")?.slug ?? services[0]?.slug;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <section className="relative overflow-hidden border-b border-border bg-gradient-mesh">
          <div className="site-container site-page-top pb-10 pt-8 sm:pb-14 sm:pt-12">
            <FadeIn className="max-w-2xl">
              <p className="text-sm font-semibold tracking-[0.16em] text-primary uppercase">Services</p>
              <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl">
                Solutions complètes pour votre business
              </h1>
              <p className="mt-4 text-muted-foreground md:text-lg">
                De la création d&apos;entreprise à la formation, nous couvrons vos besoins numériques.
              </p>
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
