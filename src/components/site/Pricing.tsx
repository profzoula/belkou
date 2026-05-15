import { Link } from "@tanstack/react-router";
import { Check, Sparkles, ShieldCheck, Clock, Users, BookOpen } from "lucide-react";

const features = [
  "Sessions Zoom en direct — Samedi & Dimanche à 10h PM (2h/session)",
  "Accès complet à la formation (4 semaines)",
  "Code source complet des projets",
  "Groupe WhatsApp communautaire",
  "Mentorat privé hebdomadaire",
  "Bibliothèque de prompts bonus",
  "Support prioritaire 24/7",
  "Certificat de completion",
  "Accès à vie + mises à jour futures",
];

const trust = [
  { icon: ShieldCheck, label: "Remboursement 7 jours" },
  { icon: Clock,       label: "Accès immédiat" },
  { icon: Users,       label: "500+ étudiants" },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-24 md:py-32 border-t border-border/40">
      <div className="container mx-auto px-6">

        {/* Header */}
        <div className="max-w-xl mx-auto text-center mb-14">
          <span className="chip mb-4 inline-flex">Tarifs</span>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Un seul plan,{" "}
            <span className="text-gradient">tout inclus</span>
          </h2>
          <p className="text-muted-foreground">
            Pas de niveaux confus. Tout le monde reçoit la même formation complète.
          </p>
        </div>

        {/* Single card */}
        <div className="max-w-lg mx-auto">
          <div className="relative rounded-3xl border-2 border-primary bg-gradient-card shadow-glow p-8 md:p-10">

            {/* Top badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap inline-flex items-center gap-1.5 rounded-full bg-gradient-primary px-5 py-1.5 text-xs font-bold text-primary-foreground shadow-glow">
              <Sparkles className="h-3 w-3" /> Formation complète
            </div>

            {/* Price block */}
            <div className="text-center mb-8 pt-2">
              <div className="flex items-end justify-center gap-2 mb-1">
                <span className="text-6xl md:text-7xl font-display font-bold text-gradient-orange leading-none">$199</span>
                <span className="text-muted-foreground mb-2 text-sm">USD</span>
              </div>
              <p className="text-sm text-muted-foreground">Paiement unique — accès à vie</p>
            </div>

            {/* Divider */}
            <div className="border-t border-border/50 mb-8" />

            {/* Ebook promo */}
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-400/40 bg-amber-400/8 px-4 py-3">
              <BookOpen className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-300">Offre spéciale — 10 premières places</p>
                <p className="text-xs text-muted-foreground mt-0.5">Recevez gratuitement notre eBook exclusif sur la formation IA.</p>
              </div>
            </div>

            {/* Features */}
            <ul className="space-y-3.5 mb-8">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm">
                  <div className="h-5 w-5 rounded-full bg-primary/15 border border-primary/35 grid place-items-center shrink-0">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-foreground/90">{f}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <a
              href="https://buy.stripe.com/9B6aEZ792gOh96ja7G4F202"
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary px-6 py-3.5 text-base font-semibold text-primary-foreground shadow-glow hover:opacity-90 transition-opacity"
            >
              S'inscrire Maintenant →
            </a>

            {/* Trust signals */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-5">
              {trust.map((t) => (
                <div key={t.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <t.icon className="h-3.5 w-3.5 text-primary/70" />
                  {t.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
