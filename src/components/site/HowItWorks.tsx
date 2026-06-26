import { Link } from "@tanstack/react-router";
import { ArrowRight, CreditCard, PlayCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/site/SectionHeader";

const steps = [
  {
    icon: Search,
    step: "01",
    title: "Explorez le catalogue",
    description: "Parcourez les cours, comparez les programmes et regardez la preview gratuite de chaque formation.",
  },
  {
    icon: CreditCard,
    step: "02",
    title: "Inscrivez-vous au cours",
    description:
      "Paiement sécurisé par Stripe, PayPal, MonCash ou virement. Vous recevez l'accès par email — preview immédiate si disponible, contenu complet selon la date du cours.",
  },
  {
    icon: PlayCircle,
    step: "03",
    title: "Apprenez à votre rythme",
    description: "Vidéos structurées, progression sauvegardée dans Mes cours et communauté pour poser vos questions.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="site-section-anchor section-divider py-16 sm:py-20 md:py-24">
      <div className="site-container">
        <SectionHeader
          label="Comment ça marche"
          title="Trois étapes, plusieurs cours"
          description="Comme Udemy ou Coursera — mais en français, pensé pour la diaspora haïtienne."
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
              Voir le catalogue <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
