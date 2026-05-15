import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    q: "Dois-je déjà savoir coder ?",
    a: "Non, absolument pas. La formation est conçue pour les débutants complets et les intermédiaires. L'IA vous aide à créer sans avoir besoin de mémoriser toute la syntaxe.",
  },
  {
    q: "Combien de temps cela prend-il ?",
    a: "Le parcours guidé dure 4 semaines, mais vous avez un accès à vie pour avancer à votre propre rythme et revoir les modules autant de fois que nécessaire.",
  },
  {
    q: "Dans quelle langue sont les cours ?",
    a: "Tout le contenu est en français, avec un peu d'anglais technique inévitable (noms d'outils, code). Aucun problème si vous ne parlez pas anglais couramment.",
  },
  {
    q: "Y a-t-il une garantie de remboursement ?",
    a: "Oui — 7 jours de garantie complète. Si vous n'êtes pas satisfait pour quelque raison que ce soit, nous vous remboursons intégralement, sans questions.",
  },
  {
    q: "Comment fonctionne le paiement ?",
    a: "Nous acceptons Stripe (carte bancaire), PayPal, et les virements bancaires. Le paiement est sécurisé et en une seule fois.",
  },
  {
    q: "Que se passe-t-il après l'inscription ?",
    a: "Vous recevez immédiatement un email de confirmation avec vos accès. Vous rejoignez le groupe WhatsApp et commencez le premier module dès le jour même.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="py-24 md:py-32 border-t border-border/40">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto">

          {/* Header */}
          <div className="text-center mb-14">
            <span className="chip mb-4 inline-flex">FAQ</span>
            <h2 className="text-4xl md:text-5xl font-bold">
              Questions{" "}
              <span className="text-gradient-orange">fréquentes</span>
            </h2>
          </div>

          {/* Accordion */}
          <Accordion type="single" collapsible className="w-full space-y-3">
            {faqs.map((f, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="rounded-xl border border-border/50 bg-gradient-card px-5 data-[state=open]:border-primary/30 transition-colors"
              >
                <AccordionTrigger className="text-left text-base font-medium hover:text-primary transition-colors py-5 [&>svg]:text-muted-foreground">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
