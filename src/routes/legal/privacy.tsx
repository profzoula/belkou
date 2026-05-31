import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, legalSections } from "@/components/site/LegalLayout";

export const Route = createFileRoute("/legal/privacy")({
  head: () => ({ meta: [{ title: "Confidentialité — BelKou" }] }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const { siteName, email } = legalSections();
  return (
    <LegalLayout title="Politique de confidentialité">
      <p>
        {siteName} respecte votre vie privée. Ce document explique quelles données nous collectons, pourquoi, et comment nous les utilisons.
      </p>
      <h2 className="text-base font-semibold text-foreground pt-4">Données collectées</h2>
      <p>Nom, email, numéro WhatsApp, pays, niveau d'expérience et plan choisi lors de votre inscription.</p>
      <h2 className="text-base font-semibold text-foreground pt-4">Utilisation</h2>
      <p>Pour gérer les inscriptions, les paiements, l'accès à la formation et la communication relative au cours.</p>
      <h2 className="text-base font-semibold text-foreground pt-4">Partage</h2>
      <p>Nous partageons les données avec les prestataires de paiement (Stripe, PayPal) et les services email uniquement lorsque c'est nécessaire.</p>
      <h2 className="text-base font-semibold text-foreground pt-4">Contact</h2>
      <p>Pour toute question sur votre vie privée : {email}</p>
    </LegalLayout>
  );
}
