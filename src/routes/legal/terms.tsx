import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, legalSections } from "@/components/site/LegalLayout";

export const Route = createFileRoute("/legal/terms")({
  head: () => ({ meta: [{ title: "Conditions d'utilisation — BelKou" }] }),
  component: TermsPage,
});

function TermsPage() {
  const { siteName, email } = legalSections();
  return (
    <LegalLayout title="Conditions d'utilisation">
      <p>En utilisant le site {siteName} et en vous inscrivant à la formation, vous acceptez les présentes conditions.</p>
      <h2 className="text-base font-semibold text-foreground pt-4">Service</h2>
      <p>{siteName} propose une formation en ligne sur le développement d'applications IA et SaaS en français.</p>
      <h2 className="text-base font-semibold text-foreground pt-4">Compte utilisateur</h2>
      <p>Vous êtes responsable de l'exactitude des informations que vous fournissez. Vous ne devez pas partager l'accès à votre compte avec d'autres personnes.</p>
      <h2 className="text-base font-semibold text-foreground pt-4">Propriété intellectuelle</h2>
      <p>Le contenu de la formation reste la propriété de {siteName}. Vous n'avez pas le droit de revendre ou redistribuer le matériel sans autorisation.</p>
      <h2 className="text-base font-semibold text-foreground pt-4">Contact</h2>
      <p>{email}</p>
    </LegalLayout>
  );
}
