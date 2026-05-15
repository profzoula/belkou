import { Link } from "@tanstack/react-router";
import { Check, Crown, Zap } from "lucide-react";

const plans = [
  {
    name: "Basic",
    price: "29",
    period: "paiement unique",
    desc: "Pour démarrer votre apprentissage",
    features: [
      "Accès complet à la formation",
      "Groupe WhatsApp communautaire",
      "Templates pour commencer",
      "Certificat de completion",
    ],
    highlight: false,
    badge: null,
    btnClass: "border border-border/70 bg-white/5 text-foreground hover:bg-white/8 hover:border-primary/40",
  },
  {
    name: "Premium",
    price: "99",
    period: "paiement unique",
    desc: "Pour ceux qui veulent aller loin",
    features: [
      "Tout ce qui est dans Basic",
      "Code source complet des projets",
      "Mentorat privé hebdomadaire",
      "Bibliothèque de prompts bonus",
      "Support prioritaire 24/7",
    ],
    highlight: true,
    badge: "Le plus populaire",
    btnClass: "bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90",
  },
  {
    name: "VIP",
    price: "299",
    period: "paiement unique",
    desc: "Session 1-on-1 avec le fondateur",
    features: [
      "Tout ce qui est dans Premium",
      "Session 1-on-1 chaque semaine",
      "Revue de votre projet personnel",
      "Accès à vie + mises à jour futures",
      "Branding & stratégie de lancement",
    ],
    highlight: false,
    badge: null,
    btnClass: "border border-secondary/50 bg-secondary/10 text-secondary-foreground hover:bg-secondary/20 hover:border-secondary/70",
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-24 md:py-32 border-t border-border/40">
      <div className="container mx-auto px-6">

        {/* Header */}
        <div className="max-w-xl mx-auto text-center mb-16">
          <span className="chip mb-4 inline-flex">Tarifs</span>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Choisissez{" "}
            <span className="text-gradient">votre plan</span>
          </h2>
          <p className="text-muted-foreground">
            Garantie de remboursement 7 jours — sans questions.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto items-start">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-2xl p-7 transition-all duration-300 ${
                p.highlight
                  ? "bg-gradient-card border-2 border-primary shadow-glow md:-translate-y-2"
                  : "bg-gradient-card border border-border/60 hover:border-border"
              }`}
            >
              {/* Badge */}
              {p.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap inline-flex items-center gap-1.5 rounded-full bg-gradient-primary px-4 py-1 text-xs font-bold text-primary-foreground shadow-glow">
                  <Crown className="h-3 w-3" /> {p.badge}
                </div>
              )}

              {/* Plan name + desc */}
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-1">
                  {p.highlight && <Zap className="h-4 w-4 text-primary" />}
                  <h3 className="font-display text-xl font-bold">{p.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{p.desc}</p>
              </div>

              {/* Price */}
              <div className="mb-6 pb-6 border-b border-border/50">
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-display font-bold text-gradient-orange">${p.price}</span>
                  <span className="text-muted-foreground text-sm mb-1">USD</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{p.period}</p>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-7">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm">
                    <div className="h-5 w-5 rounded-full bg-primary/15 border border-primary/30 grid place-items-center shrink-0 mt-0.5">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-foreground/85">{f}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                to="/register"
                search={{ plan: p.name.toLowerCase() }}
                className={`flex w-full items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${p.btnClass}`}
              >
                Choisir {p.name}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
