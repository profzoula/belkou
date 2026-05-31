import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/site/SectionHeader";
import { pricingPlans } from "@/lib/plans";

export function Pricing() {
  return (
    <section id="pricing" className="section-divider py-16 sm:py-20 md:py-24 bg-card">
      <div className="site-container">
        <SectionHeader
          label="Tarifs"
          title="Choisissez le plan adapté à vos objectifs"
          description="Les deux plans incluent la formation complète. Le VIP ajoute un accompagnement personnel sur votre projet."
          align="center"
          className="max-w-lg"
        />

        <div className="md:max-w-3xl md:mx-auto">
          <p className="text-center text-[11px] text-muted-foreground mb-3 md:hidden">
            Glissez pour comparer les plans →
          </p>
          <div className="flex md:grid md:grid-cols-2 gap-3 md:gap-5 overflow-x-auto snap-x snap-mandatory md:overflow-visible pb-2 md:pb-0 -mx-1 px-1 md:mx-0 md:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {pricingPlans.map((p) => (
              <div
                key={p.name}
                className={`relative rounded-2xl p-3.5 sm:p-5 md:p-6 transition-all min-w-[calc(50%-0.375rem)] w-[calc(50%-0.375rem)] sm:min-w-[240px] sm:w-[240px] md:min-w-0 md:w-auto shrink-0 snap-start flex flex-col ${
                  p.highlight
                    ? "bg-foreground text-background shadow-lg ring-2 ring-primary md:ring-offset-2 md:ring-offset-card lg:-translate-y-1"
                    : "surface ring-2 ring-primary/20"
                }`}
              >
                {p.highlight && p.badge && (
                  <div className="mb-2 md:mb-0 md:absolute md:-top-3 md:right-5 inline-flex rounded-full bg-secondary px-2 py-0.5 text-[9px] sm:text-[11px] font-semibold text-secondary-foreground">
                    {p.badge}
                  </div>
                )}
                {!p.highlight && p.badge && (
                  <div className="mb-2 md:mb-0 md:absolute md:-top-3 md:left-1/2 md:-translate-x-1/2 inline-flex rounded-full bg-primary px-2 py-0.5 text-[9px] sm:text-[11px] font-semibold text-primary-foreground shadow-primary leading-tight text-center">
                    {p.badge}
                  </div>
                )}
                <h3 className="text-sm sm:text-base font-semibold">{p.name}</h3>
                <p
                  className={`text-[11px] sm:text-sm mt-1 mb-3 sm:mb-5 leading-snug ${p.highlight ? "text-background/70" : "text-muted-foreground"}`}
                >
                  {p.desc}
                </p>
                <div
                  className={`mb-3 sm:mb-6 pb-3 sm:pb-6 border-b ${p.highlight ? "border-background/15" : "border-border"}`}
                >
                  <span className="text-2xl sm:text-4xl font-semibold tracking-tight">${p.price}</span>
                  <span
                    className={`ml-1 text-[11px] sm:text-sm ${p.highlight ? "text-background/60" : "text-muted-foreground"}`}
                  >
                    USD
                  </span>
                </div>
                <ul className="space-y-1.5 sm:space-y-2.5 mb-4 sm:mb-7 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5 sm:gap-2.5 text-[10px] sm:text-sm leading-snug">
                      <Check
                        className={`h-3 w-3 sm:h-4 sm:w-4 shrink-0 mt-0.5 ${p.highlight ? "text-primary-foreground" : "text-primary"}`}
                      />
                      <span className={p.highlight ? "text-background/90" : "text-foreground/85"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  variant={p.highlight ? "neon" : "purple"}
                  size="lg"
                  className={`w-full touch-target h-auto min-h-10 py-2 text-xs sm:text-sm ${p.highlight ? "border-background/25 bg-background/10 text-background hover:bg-background hover:text-foreground" : ""}`}
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
