import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SectionHeader } from "@/components/site/SectionHeader";
import { siteConfig } from "@/lib/site-config";

const faqs = [
  { q: "Dois-je déjà savoir coder ?", a: "Non. La formation est conçue pour les débutants et intermédiaires. Nous vous montrerons comment l'IA peut vous aider à créer sans connaître toute la syntaxe." },
  { q: "Combien de temps cela prend-il ?", a: "Le format recommandé dure 8 semaines (2 à 3 jours par semaine, sessions de 2h à 3h). Une option intensive de 6 semaines est aussi disponible. Vous gardez un accès à vie au contenu." },
  { q: "Dans quelle langue sont les cours ?", a: "Les cours sont dispensés en français. Quelques termes techniques en anglais peuvent apparaître pour le code et les outils." },
  { q: "Y a-t-il un remboursement ?", a: "Non. Toutes les inscriptions sont définitives. Assurez-vous d'être prêt avant de vous inscrire." },
  { q: "Comment fonctionne le paiement ?", a: `Nous acceptons : ${siteConfig.paymentMethods.join(", ")}. Après inscription, vous recevrez les instructions de paiement par email. Premium et VIP incluent le même contenu — le VIP ajoute un accompagnement personnel sur votre projet.` },
];

export function FAQ() {
  return (
    <section id="faq" className="section-divider py-16 sm:py-20 md:py-24 bg-card">
      <div className="site-container">
        <div className="grid lg:grid-cols-5 gap-8 lg:gap-12 max-w-5xl mx-auto">
          <div className="lg:col-span-2">
            <SectionHeader
              label="FAQ"
              title="Questions fréquentes"
              description="Vous avez d'autres questions ? Écrivez-nous sur WhatsApp après votre inscription."
              className="mb-0"
            />
          </div>

          <div className="lg:col-span-3 surface rounded-2xl px-4 sm:px-5 md:px-6">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((f, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="border-border last:border-0">
                  <AccordionTrigger className="text-left text-sm font-medium hover:text-primary py-4 hover:no-underline touch-target items-start [&>svg]:mt-1">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-4 leading-relaxed">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
}
