import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";
import { Check, Star } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { ServiceBookingForm } from "@/components/services/ServiceBookingForm";
import { getPublicServiceBySlug } from "@/lib/fns/services";
import { serializableToServiceItem } from "@/lib/service-storage";
import type { ServiceItem } from "@/lib/service-storage";
import { formatCount } from "@/lib/courses";
import { seoHead } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/services/$slug")({
  head: ({ loaderData }) => {
    const service = loaderData as ServiceItem | undefined;
    if (!service) return {};
    return seoHead({
      title: `${service.title} — Services BelKou`,
      description: service.description,
      path: `/services/${service.slug}`,
    });
  },
  loader: async ({ params }) => {
    const service = await getPublicServiceBySlug({ data: { slug: params.slug } });
    if (!service) throw notFound();
    if (service.action.type === "link") {
      throw redirect({ to: service.action.href });
    }
    return serializableToServiceItem(service);
  },
  component: ServiceDetailPage,
});

function ServiceDetailPage() {
  const service = Route.useLoaderData() as ServiceItem | undefined;

  if (!service) return null;

  const Icon = service.icon;

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <main className="site-page-top site-container py-10 sm:py-14">
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="font-display text-2xl font-bold sm:text-3xl md:text-4xl">Prendre rendez-vous</h1>
          <p className="mt-2 text-muted-foreground">
            Pour le service : <span className="font-semibold text-foreground">{service.title}</span>
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-5xl gap-8 lg:grid-cols-2 lg:items-start">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className={cn("relative aspect-[16/10] bg-gradient-to-br", service.gradient)}>
              {service.imageUrl ? (
                <img src={service.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Icon className="h-20 w-20 text-white/20" aria-hidden />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              {service.premium ? (
                <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase text-primary-foreground">
                  <Star className="h-3 w-3 fill-current" />
                  Premium
                </span>
              ) : null}
            </div>

            <div className="p-5 sm:p-6">
              <h2 className="font-display text-2xl font-bold">{service.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{service.description}</p>

              <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
                <span className="text-sm text-muted-foreground">Prix</span>
                <span className="text-xl font-bold">{service.priceLabel}</span>
              </div>

              <div className="mt-6 rounded-xl bg-muted/40 p-4">
                <h3 className="text-sm font-semibold">Ce que vous obtenez :</h3>
                <ul className="mt-3 space-y-2">
                  {service.deliverables.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Check className="h-3 w-3 text-primary" strokeWidth={2.5} />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <p className="mt-4 text-xs text-muted-foreground">
                {service.provider} · {service.rating.toFixed(1)}/5 ({formatCount(service.ratingsCount)} avis)
              </p>
            </div>
          </div>

          <ServiceBookingForm service={service} />
        </div>

        <p className="mx-auto mt-8 max-w-5xl text-center text-sm text-muted-foreground">
          <Link to="/services" className="font-semibold text-primary hover:underline">
            ← Retour aux services
          </Link>
        </p>
      </main>
      <Footer />
    </div>
  );
}
