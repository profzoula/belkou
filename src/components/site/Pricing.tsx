import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/site/SectionHeader";
import { siteConfig } from "@/lib/site-config";

const premiumFeatures = [
  "Accès complet à la formation",
  "Groupe WhatsApp Premium VibeCode",
  "Code source complet",
  "Templates et ressources",
  "Support communautaire",
];

const plans = [
  {
    name: siteConfig.plans.premium.name,
    price: String(siteConfig.plans.premium.price),
    planId: "premium" as const,
    desc: "Tout ce qu'il faut pour apprendre et lancer votre projet",
    features: premiumFeatures,
    variant: "hero" as const,
    highlight: true,
  },
  {
    name: siteConfig.plans.vip.name,
    price: String(siteConfig.plans.vip.price),
    planId: "vip" as const,
    desc: "Tout le Premium + accompagnement personnel sur votre projet",
    features: [
      "Tout ce qui est inclus dans Premium",
      "Groupe WhatsApp VIP VibeCode",
      "Ebook gratuit",
      "Assistance personnelle du formateur",
      "Aide directe pendant la réalisation de votre projet",
      "Revue et conseils sur votre travail",
    ],
    variant: "purple" as const,
    highlight: false,
    badge: "Accompagnement 1-on-1",
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="section-divider py-20 md:py-24 bg-card">
      <div className="container mx-auto px-6">
        <SectionHeader
          label="Tarifs"
          title="Choisissez le plan adapté à vos objectifs"
          description="Les deux plans incluent la formation complète. Le VIP ajoute un accompagnement personnel sur votre projet."
          align="center"
          className="max-w-lg"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto items-start">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-2xl p-6 transition-all ${
                p.highlight
                  ? "bg-foreground text-background shadow-lg ring-2 ring-primary ring-offset-2 ring-offset-card md:-translate-y-1"
                  : "surface ring-2 ring-primary/20"
              }`}
            >
              {"badge" in p && p.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[11px] font-semibold text-primary-foreground shadow-primary whitespace-nowrap">
                  {p.badge}
                </div>
              )}
              {p.highlight && (
                <div className="absolute -top-3 right-5 rounded-full bg-secondary px-3 py-0.5 text-[11px] font-semibold text-secondary-foreground">
                  Populaire
                </div>
              )}
              <h3 className="text-base font-semibold">{p.name}</h3>
              <p className={`text-sm mt-1 mb-5 ${p.highlight ? "text-background/70" : "text-muted-foreground"}`}>
                {p.desc}
              </p>
              <div className={`mb-6 pb-6 border-b ${p.highlight ? "border-background/15" : "border-border"}`}>
                <span className="text-4xl font-semibold tracking-tight">${p.price}</span>
                <span className={`ml-1.5 text-sm ${p.highlight ? "text-background/60" : "text-muted-foreground"}`}>
                  USD
                </span>
              </div>
              <ul className="space-y-2.5 mb-7">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className={`h-4 w-4 shrink-0 mt-0.5 ${p.highlight ? "text-primary-foreground" : "text-primary"}`} />
                    <span className={p.highlight ? "text-background/90" : "text-foreground/85"}>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                asChild
                variant={p.highlight ? "neon" : p.variant}
                size="lg"
                className={`w-full ${p.highlight ? "border-background/25 bg-background/10 text-background hover:bg-background hover:text-foreground" : ""}`}
              >
                <Link to="/register" search={{ plan: p.planId }}>
                  Choisir {p.name}
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
