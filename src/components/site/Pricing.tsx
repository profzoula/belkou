import { Link } from "@tanstack/react-router";
import { Check, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Basic",
    price: "29",
    desc: "Pour commencer votre apprentissage",
    features: ["Accès complet à la formation", "Groupe WhatsApp", "Templates pour commencer", "Certificat"],
    variant: "neon" as const,
    highlight: false,
  },
  {
    name: "Premium",
    price: "99",
    desc: "Pour ceux qui veulent aller loin",
    features: ["Tout ce qui est dans Basic", "Code source complet", "Mentorat privé", "Bibliothèque de prompts bonus", "Support prioritaire"],
    variant: "hero" as const,
    highlight: true,
  },
  {
    name: "VIP",
    price: "299",
    desc: "1-on-1 avec le fondateur",
    features: ["Tout ce qui est dans Premium", "Session 1-on-1 chaque semaine", "Examen du projet personnel", "Accès à vie", "Branding et lancement"],
    variant: "purple" as const,
    highlight: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-24 md:py-32">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Tarifs</p>
          <h2 className="text-4xl md:text-6xl font-bold">Choisissez <span className="text-gradient">votre plan</span></h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-3xl p-8 transition-all duration-500 ${
                p.highlight
                  ? "bg-gradient-card border-2 border-primary shadow-glow scale-100 md:scale-105"
                  : "bg-gradient-card border border-border hover:border-primary/30"
              }`}
            >
              {p.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-gradient-primary px-4 py-1 text-xs font-bold text-primary-foreground shadow-glow">
                  <Crown className="h-3 w-3" /> PLUS POPULAIRE
                </div>
              )}
              <h3 className="font-display text-2xl font-bold mb-2">{p.name}</h3>
              <p className="text-sm text-muted-foreground mb-6">{p.desc}</p>
              <div className="mb-6">
                <span className="text-5xl font-display font-bold text-gradient-orange">${p.price}</span>
                <span className="text-muted-foreground ml-1">USD</span>
              </div>
              <ul className="space-y-3 mb-8">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button asChild variant={p.variant} size="lg" className="w-full">
                <Link to="/register" search={{ plan: p.name.toLowerCase() }}>Choisir {p.name}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
