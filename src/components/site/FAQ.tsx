import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  { q: "Dois-je déjà savoir coder ?", a: "Non. La formation est conçue pour les débutants et intermédiaires. Nous vous montrerons comment l'IA peut vous aider à créer sans connaître toute la syntaxe." },
  { q: "Combien de temps cela prend-il ?", a: "Le parcours complet dure 4 semaines, mais vous avez un accès à vie pour suivre à votre rythme." },
  { q: "Dans quelle langue sont les cours ?", a: "Tout le contenu est en français avec un peu d'anglais technique (code et outils)." },
  { q: "Y a-t-il un remboursement ?", a: "Oui — 7 jours de garantie. Si vous n'êtes pas satisfait, nous vous remboursons sans poser de questions." },
  { q: "Comment fonctionne le paiement ?", a: "Nous acceptons Stripe, PayPal, et les virements bancaires." },
];

export function FAQ() {
  return (
    <section id="faq" className="py-24 md:py-32">
      <div className="container mx-auto px-6 max-w-3xl">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">FAQ</p>
          <h2 className="text-4xl md:text-6xl font-bold">Questions <span className="text-gradient-orange">fréquemment posées</span></h2>
        </div>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-border">
              <AccordionTrigger className="text-left text-lg font-medium hover:text-primary">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
