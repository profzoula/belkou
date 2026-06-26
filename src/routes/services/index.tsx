import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { SectionHeader } from "@/components/site/SectionHeader";
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
      <main className="site-page-top site-container py-10 sm:py-14 md:py-16">
        <SectionHeader
          label="Nos services"
          title="Solutions complètes pour votre business"
          description="De la création d'entreprise à la formation, nous couvrons tous vos besoins numériques."
          className="max-w-2xl"
        />

        {services.length === 0 ? (
          <p className="mt-10 text-muted-foreground">Aucun service disponible pour le moment.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <ServiceCard key={service.slug} service={service} />
            ))}
          </div>
        )}

        {contactSlug ? (
          <p className="mt-10 text-center text-sm text-muted-foreground">
            Besoin d&apos;un service sur mesure ?{" "}
            <Link to="/services/$slug" params={{ slug: contactSlug }} className="font-semibold text-primary hover:underline">
              Contactez-nous
            </Link>{" "}
            pour un devis personnalisé.
          </p>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
