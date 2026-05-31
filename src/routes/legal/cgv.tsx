import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, legalSections } from "@/components/site/LegalLayout";
import { siteConfig } from "@/lib/site-config";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/legal/cgv")({
  head: () =>
    seoHead({
      title: "Conditions générales de vente — BelKou",
      description: "CGV BelKou : tarifs, accès à la formation, remboursements et modalités de paiement.",
      path: "/legal/cgv",
    }),  component: CgvPage,
});

function CgvPage() {
  const { siteName, email } = legalSections();
  return (
    <LegalLayout title="Conditions générales de vente">
      <p>Les présentes CGV régissent l'achat des plans Premium (${siteConfig.plans.premium.price}) et VIP (${siteConfig.plans.vip.price}) USD.</p>
      <h2 className="text-base font-semibold text-foreground pt-4">Paiement</h2>
      <p>Le paiement s'effectue via Stripe, PayPal, MonCash, Zelle ou virement bancaire selon les instructions reçues après inscription.</p>
      <h2 className="text-base font-semibold text-foreground pt-4">Livraison</h2>
      <p>L'accès à la formation est fourni par email et WhatsApp après confirmation du paiement. Date de début : {siteConfig.cohortStartDate}.</p>
      <h2 className="text-base font-semibold text-foreground pt-4">Remboursement</h2>
      <p><strong>Aucun remboursement.</strong> Toute inscription est définitive. Vérifiez votre plan avant de payer.</p>
      <h2 className="text-base font-semibold text-foreground pt-4">Plan VIP</h2>
      <p>Le plan VIP inclut tout le contenu Premium, plus un accompagnement personnel sur votre projet pendant la formation.</p>
      <h2 className="text-base font-semibold text-foreground pt-4">Contact</h2>
      <p>{email}</p>
    </LegalLayout>
  );
}
