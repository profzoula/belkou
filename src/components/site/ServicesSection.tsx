import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { FadeIn } from "@/components/motion/FadeIn";
import { ServiceCard } from "@/components/services/ServiceCard";
import type { ServiceItem } from "@/lib/service-storage";
import { cn } from "@/lib/utils";

type ServicesSectionProps = {
  services: ServiceItem[];
  maxVisible?: number;
};

export function ServicesSection({ services, maxVisible = 3 }: ServicesSectionProps) {
  const visible = services.slice(0, maxVisible);

  if (!visible.length) return null;

  return (
    <section id="services" className="site-section-anchor border-y border-border/60 bg-primary/[0.03] py-10 sm:py-16 md:py-20">
      <div className="site-container">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
            Nos <span className="text-primary">services</span>
          </h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            LLC, développement, marketing et plus — BelKou vous accompagne au-delà des cours.
          </p>
        </FadeIn>

        <div
          className={cn(
            "mt-8 grid gap-4 sm:mt-10 sm:gap-5",
            visible.length === 1 && "mx-auto max-w-md grid-cols-1",
            visible.length === 2 && "mx-auto max-w-3xl grid-cols-1 sm:grid-cols-2",
            visible.length >= 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
          )}
        >
          {visible.map((service, index) => (
            <FadeIn key={service.slug} delay={Math.min(index * 0.05, 0.2)}>
              <ServiceCard service={service} />
            </FadeIn>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            to="/services"
            className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-primary/35 bg-primary/5 px-8 text-sm font-semibold text-primary transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Voir tous les services
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
