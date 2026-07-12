import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCount } from "@/lib/courses";
import type { ServiceItem } from "@/lib/service-storage";
import { cn } from "@/lib/utils";

type ServiceCardProps = {
  service: ServiceItem;
};

export function ServiceCard({ service }: ServiceCardProps) {
  const Icon = service.icon;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:border-primary/20 hover:shadow-md">
      <div className={cn("relative aspect-[16/10] overflow-hidden bg-gradient-to-br", service.gradient)}>
        {service.imageUrl ? (
          <img src={service.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon className="h-16 w-16 text-white/25" aria-hidden />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />
        {service.premium ? (
          <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary-foreground shadow-sm">
            <Star className="h-3 w-3 fill-current" />
            Premium
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="font-display text-lg font-bold leading-snug">{service.title}</h3>
        <p className="mt-2 flex-1 text-sm text-muted-foreground leading-relaxed">{service.description}</p>
        <p className="mt-3 text-xs text-muted-foreground">{service.provider}</p>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-0.5 font-bold text-amber-600">
            {service.rating.toFixed(1)}
            <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
          </span>
          <span className="text-muted-foreground">({formatCount(service.ratingsCount)})</span>
        </div>

        <p className="mt-3 text-lg font-bold">{service.priceLabel}</p>

        <div className="mt-4">
          {service.action.type === "link" ? (
            <Button asChild variant="hero" className="w-full rounded-lg">
              <Link to={service.action.href}>{service.action.label}</Link>
            </Button>
          ) : (
            <Button asChild variant="hero" className="w-full rounded-lg">
              <Link to="/services/$slug" params={{ slug: service.slug }}>
                Prendre rendez-vous
              </Link>
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
