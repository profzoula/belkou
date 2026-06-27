import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

export const faqs = [
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
] as const;

type FaqAccordionProps = {
  className?: string;
};

export function FaqAccordion({ className }: FaqAccordionProps) {
  return (
    <div className={cn("surface rounded-2xl border border-border px-4 sm:px-6", className)}>
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((f, i) => (
          <AccordionItem key={f.q} value={`item-${i}`} className="border-border last:border-0">
            <AccordionTrigger className="touch-target items-start py-5 text-left text-sm font-medium hover:text-primary hover:no-underline sm:text-base [&>svg]:mt-1">
              {f.q}
            </AccordionTrigger>
            <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
