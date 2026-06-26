import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SectionHeader } from "@/components/site/SectionHeader";
import { siteConfig } from "@/lib/site-config";

const faqs = [
  {
    q: "Comment fonctionne BelKou ?",
    a: "BelKou est une plateforme de cours en vidéo. Vous parcourez le catalogue, choisissez une formation, vous inscrivez et accédez aux leçons à votre rythme. Chaque cours propose une preview gratuite.",
  },
  {
    q: "Dois-je déjà savoir coder ?",
    a: "Non. Nos cours couvrent du débutant à l'intermédiaire. L'IA (Cursor, Claude) vous aide à créer sans maîtriser toute la syntaxe.",
  },
  {
    q: "Puis-je acheter un seul cours ?",
    a: "Oui. Chaque cours a sa propre page avec programme, preview et prix. Vous vous inscrivez au cours qui vous intéresse — pas besoin de tout acheter d'un coup.",
  },
  {
    q: "Un cours est « bientôt disponible » — que puis-je faire ?",
    a: "Vous pouvez vous inscrire dès maintenant. La preview gratuite est souvent accessible avant le lancement, et le contenu complet se débloque automatiquement à la date indiquée sur la page du cours.",
  },
  {
    q: "Dans quelle langue sont les cours ?",
    a: "Les cours sont en français. Quelques termes techniques en anglais peuvent apparaître pour le code et les outils.",
  },
  {
    q: "Comment fonctionne le paiement ?",
    a: `Nous acceptons : ${siteConfig.paymentMethods.join(", ")}. Après paiement confirmé, vous recevez l'accès au cours par email.`,
  },
  {
    q: "Y a-t-il un remboursement ?",
    a: "Non. Toutes les inscriptions sont définitives. Profitez de la preview gratuite avant de vous inscrire.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="site-section-anchor section-divider section-alt py-16 sm:py-20 md:py-28">
      <div className="site-container max-w-3xl mx-auto">
        <SectionHeader
          label="FAQ"
          title="Des questions ?"
          description="Tout ce qu'il faut savoir sur la plateforme BelKou et nos cours en ligne."
          className="mb-10"
        />

        <div className="surface rounded-2xl px-4 sm:px-6 border border-border">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-border last:border-0">
                <AccordionTrigger className="text-left text-sm sm:text-base font-medium hover:text-primary py-5 hover:no-underline touch-target items-start [&>svg]:mt-1">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground pb-5 leading-relaxed">
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
