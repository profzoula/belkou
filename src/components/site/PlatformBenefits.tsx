import { BookOpen, Check, Globe, Play, Shield, Zap } from "lucide-react";
import { SectionHeader } from "@/components/site/SectionHeader";
import { siteConfig } from "@/lib/site-config";

const platformHighlights = [
  "Catalogue multi-cours — achetez uniquement ce dont vous avez besoin",
  "Preview gratuite sur chaque cours, sans inscription",
  "Accès à vie au cours acheté, progression sauvegardée",
  "Nouvelles formations ajoutées régulièrement",
];

const benefits = [
  {
    icon: BookOpen,
    title: "Un cours = un achat",
    description: "Pas d'abonnement global. Choisissez une formation, payez une fois, accédez à toutes ses leçons.",
  },
  {
    icon: Play,
    title: "Preview avant paiement",
    description: "Regardez des leçons d'introduction avant de vous inscrire — zéro surprise.",
  },
  {
    icon: Zap,
    title: "Leçons en vidéo HD",
    description: "Modules structurés, durée indiquée et lecteur intégré pour avancer à votre rythme.",
  },
  {
    icon: Globe,
    title: "100 % en français",
    description: "Formations adaptées à la diaspora — Haïti, USA, Canada et au-delà.",
  },
  {
    icon: Shield,
    title: "Paiements flexibles",
    description: siteConfig.paymentMethods.join(", "),
  },
];

export function PlatformBenefits() {
  return (
    <section id="benefits" className="site-section-anchor py-16 sm:py-20 md:py-24 bg-gradient-mesh">
      <div className="site-container">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-start max-w-5xl mx-auto">
          <div>
            <SectionHeader
              label="Pourquoi BelKou"
              title="Une plateforme, plusieurs formations"
              description="BelKou n'est plus une seule cohorte — c'est un catalogue de cours spécialisés que vous explorez et achetez individuellement."
              align="left"
              className="mb-0 sm:mb-0"
            />

            <ul className="mt-8 space-y-3">
              {platformHighlights.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Check className="h-3 w-3 text-primary" strokeWidth={2.5} />
                  </span>
                  <span className="text-foreground/90">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {benefits.map((b) => (
              <div key={b.title} className="surface surface-hover rounded-xl p-4 flex gap-3 min-w-0">
                <div className="icon-box shrink-0 h-9 w-9">
                  <b.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold">{b.title}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{b.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
