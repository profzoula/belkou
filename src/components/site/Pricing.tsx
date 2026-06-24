import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/site/SectionHeader";
import { pricingPlans } from "@/lib/plans";

export function Pricing() {
  return (
    <section id="pricing" className="site-section-anchor section-divider section-alt py-16 sm:py-20 md:py-28">
      <div className="site-container">
        <SectionHeader
          label="Tarifs"
          title="Des plans simples et transparents"
          description="Les deux plans incluent la formation complète. Le VIP ajoute un accompagnement personnel sur votre projet."
          className="max-w-lg"
        />

        <div className="md:max-w-3xl md:mx-auto">
          <p className="text-center text-[11px] text-muted-foreground mb-3 md:hidden">
            Glissez pour comparer les plans →
          </p>
          <div className="scroll-carousel md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:pb-0">
            {pricingPlans.map((p) => (
              <div
                key={p.name}
                className={`relative rounded-2xl p-5 sm:p-6 transition-all w-[min(100%,20rem)] min-w-[85vw] sm:min-w-[260px] sm:w-[260px] md:min-w-0 md:w-auto flex flex-col bg-card border ${
                  p.highlight
                    ? "border-primary shadow-primary ring-1 ring-primary/20 md:-translate-y-1"
                    : "border-border shadow-sm"
                }`}
              >
                {p.badge && (
                  <div
                    className={`mb-3 md:mb-0 md:absolute md:-top-3 inline-flex rounded-full px-3 py-1 text-[10px] sm:text-xs font-semibold leading-tight ${
                      p.highlight
                        ? "md:right-5 bg-primary text-primary-foreground"
                        : "md:left-1/2 md:-translate-x-1/2 bg-secondary text-secondary-foreground border border-border"
                    }`}
                  >
                    {p.badge}
                  </div>
                )}
                <h3 className="text-base sm:text-lg font-semibold">{p.name}</h3>
                <p className="text-xs sm:text-sm mt-1 mb-5 text-muted-foreground leading-snug">{p.desc}</p>
                <div className="mb-5 pb-5 border-b border-border">
                  <span className="font-display text-3xl sm:text-4xl font-bold tracking-tight">${p.price}</span>
                  <span className="ml-1 text-sm text-muted-foreground">USD</span>
                </div>
                <ul className="space-y-2.5 mb-6 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-xs sm:text-sm leading-snug">
                      <Check className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                      <span className="text-foreground/85">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  variant={p.highlight ? "hero" : "soft"}
                  size="lg"
                  className="w-full touch-target h-auto min-h-10 py-2.5 text-xs sm:text-sm"
                >
                  <Link to="/register" search={{ plan: p.id }}>
                    Choisir {p.name}
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
