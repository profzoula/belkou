import { Link } from "@tanstack/react-router";
import { ArrowRight, CreditCard, PlayCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/site/SectionHeader";
import { siteConfig } from "@/lib/site-config";

const steps = [
  {
    icon: Search,
    step: "01",
    title: "Choisissez un cours",
    description: "Parcourez le catalogue, lisez le programme et regardez la preview gratuite avant de vous décider.",
  },
  {
    icon: CreditCard,
    step: "02",
    title: "Inscrivez-vous",
    description: `Paiement sécurisé par Stripe, PayPal, MonCash ou virement. Confirmation immédiate — accès complet selon le calendrier du cours (preview dès l'inscription, lancement ${siteConfig.cohortStartDate}).`,
  },
  {
    icon: PlayCircle,
    step: "03",
    title: "Apprenez à votre rythme",
    description: "Vidéos Vimeo HD, leçons structurées et communauté WhatsApp pour avancer sur vos projets.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="site-section-anchor section-divider py-16 sm:py-20 md:py-24">
      <div className="site-container">
        <SectionHeader
          label="Comment ça marche"
          title="De l'inscription à votre premier projet"
          description="Simple, transparent et en français — comme une plateforme de cours en ligne, pensée pour la diaspora."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-10">
          {steps.map((item) => (
            <div key={item.step} className="relative surface rounded-2xl p-6 text-center">
              <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
                <item.icon className="h-5 w-5" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-primary">{item.step}</span>
              <h3 className="mt-2 font-semibold text-base">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button asChild variant="hero" className="rounded-full touch-target">
            <Link to="/courses">
              Commencer maintenant <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
