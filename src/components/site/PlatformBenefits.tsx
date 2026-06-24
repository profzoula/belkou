import { Check, Globe, MessageCircle, Play, Shield, Zap } from "lucide-react";
import { SectionHeader } from "@/components/site/SectionHeader";
import { siteConfig } from "@/lib/site-config";

const benefits = [
  {
    icon: Play,
    title: "Vidéos structurées",
    description: "Chaque cours est découpé en modules et leçons claires, avec durée et progression.",
  },
  {
    icon: Zap,
    title: "Preview gratuite",
    description: "Regardez des leçons d'introduction avant de payer — zéro surprise.",
  },
  {
    icon: MessageCircle,
    title: "Communauté active",
    description: "Groupes WhatsApp Premium et VIP pour poser vos questions et avancer ensemble.",
  },
  {
    icon: Globe,
    title: "100 % en français",
    description: "Formations adaptées à la diaspora — Haïti, USA, Canada et au-delà.",
  },
  {
    icon: Shield,
    title: "Paiements flexibles",
    description: `Stripe, PayPal, MonCash, Zelle et virement bancaire.`,
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
              title="Une plateforme pensée pour les créateurs"
              description="Pas une seule formation figée — un catalogue qui grandit, avec des cours spécialisés que vous pouvez acheter individuellement."
              align="left"
              className="mb-0 sm:mb-0"
            />

            <ul className="mt-8 space-y-3">
              {siteConfig.formation.objectives.slice(0, 4).map((item) => (
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
