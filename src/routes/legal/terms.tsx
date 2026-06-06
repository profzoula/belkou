import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, legalSections } from "@/components/site/LegalLayout";
import { siteConfig } from "@/lib/site-config";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/legal/terms")({
  head: () =>
    seoHead({
      title: "Conditions d'utilisation — BelKou",
      description:
        "Conditions d'utilisation du site et des services BelKou.",
      path: "/legal/terms",
    }),
  component: TermsPage,
});

function TermsPage() {
  const { siteName, email } = legalSections();
  return (
    <LegalLayout title="Conditions d'utilisation">
      <h2 className="text-base font-semibold text-foreground pt-4">
        Article 1 — Acceptation des conditions
      </h2>
      <p>
        En accédant au site <strong>{siteConfig.siteUrl}</strong> et en
        utilisant les services proposés par <strong>{siteName}</strong>, vous
        acceptez sans réserve les présentes conditions d'utilisation. Si vous
        n'acceptez pas ces conditions, veuillez ne pas utiliser le site ni vous
        inscrire à la formation. L'utilisation continue du site vaut
        acceptation de toute modification ultérieure de ces conditions.
      </p>

      <h2 className="text-base font-semibold text-foreground pt-4">
        Article 2 — Description du service
      </h2>
      <p>
        {siteName} propose une formation en ligne spécialisée dans le
        développement d'applications utilisant l'intelligence artificielle (IA)
        et les technologies SaaS (Software as a Service). La formation est
        dispensée en français, organisée par cohorte avec une durée recommandée
        de {siteConfig.formation.durationRecommended}. Le programme comprend des
        cours structurés, des exercices pratiques, des projets concrets et un
        accès à une communauté de participants via WhatsApp.
      </p>
      <p>
        Deux plans sont disponibles : le plan{" "}
        <strong>{siteConfig.plans.premium.name}</strong> ($
        {siteConfig.plans.premium.price} USD) et le plan{" "}
        <strong>{siteConfig.plans.vip.name}</strong> ($
        {siteConfig.plans.vip.price} USD), dont les détails sont décrits dans
        les conditions générales de vente.
      </p>

      <h2 className="text-base font-semibold text-foreground pt-4">
        Article 3 — Compte utilisateur
      </h2>
      <p>
        Lors de votre inscription, vous vous engagez à fournir des informations
        exactes, complètes et à jour. Vous êtes responsable de la
        confidentialité de vos identifiants de connexion et de toute activité
        effectuée sous votre compte. Il est strictement interdit de :
      </p>
      <ul className="list-disc list-inside space-y-1">
        <li>Partager vos accès à la formation avec des tiers</li>
        <li>Créer plusieurs comptes pour une même personne</li>
        <li>Usurper l'identité d'une autre personne lors de l'inscription</li>
      </ul>
      <p>
        En cas de suspicion d'utilisation frauduleuse de votre compte,{" "}
        {siteName} se réserve le droit de suspendre ou de résilier votre accès
        sans préavis.
      </p>

      <h2 className="text-base font-semibold text-foreground pt-4">
        Article 4 — Contenu de la formation
      </h2>
      <p>
        L'accès à la formation est strictement personnel et non transférable.
        Le contenu mis à votre disposition (vidéos, documents, exercices, code
        source) est destiné à votre usage personnel dans le cadre de votre
        apprentissage. Vous ne pouvez pas :
      </p>
      <ul className="list-disc list-inside space-y-1">
        <li>Reproduire ou copier le contenu à des fins de redistribution</li>
        <li>Enregistrer ou capturer les sessions de formation</li>
        <li>Partager les supports avec des personnes non inscrites</li>
        <li>Utiliser le contenu à des fins commerciales sans autorisation</li>
      </ul>

      <h2 className="text-base font-semibold text-foreground pt-4">
        Article 5 — Obligations de l'utilisateur
      </h2>
      <p>
        En tant qu'utilisateur de la plateforme et membre de la communauté
        {siteName}, vous vous engagez à :
      </p>
      <ul className="list-disc list-inside space-y-1">
        <li>Adopter un comportement respectueux envers les autres participants et le formateur</li>
        <li>Ne pas publier de contenu offensant, discriminatoire ou inapproprié dans les groupes WhatsApp</li>
        <li>Ne pas envoyer de spam ou de messages commerciaux non sollicités</li>
        <li>Ne pas harceler, intimider ou menacer d'autres membres</li>
        <li>Respecter la propriété intellectuelle de {siteName} et des autres participants</li>
        <li>Signaler tout comportement inapproprié à l'équipe {siteName}</li>
      </ul>
      <p>
        Tout manquement à ces obligations pourra entraîner une exclusion
        immédiate du programme sans remboursement.
      </p>

      <h2 className="text-base font-semibold text-foreground pt-4">
        Article 6 — Propriété intellectuelle
      </h2>
      <p>
        L'ensemble des contenus disponibles sur le site et dans la formation
        (textes, images, vidéos, logos, code source, supports de cours, marques)
        sont protégés par les lois relatives à la propriété intellectuelle et
        restent la propriété exclusive de {siteName}. Toute reproduction,
        représentation, modification, publication, adaptation de tout ou partie
        des éléments du site et de la formation, quel que soit le moyen ou le
        procédé utilisé, est interdite sans l'autorisation écrite préalable de{" "}
        {siteName}.
      </p>

      <h2 className="text-base font-semibold text-foreground pt-4">
        Article 7 — Limitation de responsabilité
      </h2>
      <p>
        Le service de formation est fourni « en l'état » et « tel que
        disponible ». {siteName} ne garantit pas que le service sera
        ininterrompu, exempt d'erreurs ou que les résultats obtenus seront
        conformes aux attentes de l'utilisateur. En particulier :
      </p>
      <ul className="list-disc list-inside space-y-1">
        <li>{siteName} ne garantit aucun résultat spécifique en termes d'emploi ou de revenus</li>
        <li>L'utilisateur est seul responsable de l'utilisation qu'il fait des connaissances acquises</li>
        <li>La responsabilité de {siteName} ne saurait excéder le montant payé par l'utilisateur</li>
      </ul>
      <p>
        {siteName} ne pourra être tenu responsable des dommages indirects,
        accessoires ou consécutifs résultant de l'utilisation ou de
        l'impossibilité d'utilisation du service.
      </p>

      <h2 className="text-base font-semibold text-foreground pt-4">
        Article 8 — Suspension et résiliation
      </h2>
      <p>
        {siteName} se réserve le droit de suspendre ou de résilier l'accès
        d'un utilisateur, sans préavis ni remboursement, dans les cas suivants :
      </p>
      <ul className="list-disc list-inside space-y-1">
        <li>Violation des présentes conditions d'utilisation</li>
        <li>Comportement nuisible envers les autres participants ou le formateur</li>
        <li>Partage non autorisé du contenu de la formation</li>
        <li>Utilisation frauduleuse du service</li>
        <li>Non-paiement ou paiement contesté de manière abusive</li>
      </ul>
      <p>
        L'utilisateur dont l'accès a été résilié n'a droit à aucun
        remboursement et ne pourra prétendre à aucune indemnisation.
      </p>

      <h2 className="text-base font-semibold text-foreground pt-4">
        Article 9 — Communications
      </h2>
      <p>
        En vous inscrivant à la formation, vous consentez à recevoir des
        communications par email relatives au service, notamment :
      </p>
      <ul className="list-disc list-inside space-y-1">
        <li>Email de confirmation d'inscription</li>
        <li>Informations d'accès à la formation et au groupe WhatsApp</li>
        <li>Annonces et mises à jour relatives au programme</li>
        <li>Rappels et informations logistiques</li>
      </ul>
      <p>
        Ces communications sont considérées comme essentielles au service et ne
        constituent pas du marketing. Vous pouvez nous contacter pour toute
        question relative à ces communications.
      </p>

      <h2 className="text-base font-semibold text-foreground pt-4">
        Article 10 — Loi applicable
      </h2>
      <p>
        Les présentes conditions d'utilisation sont régies par le droit en
        vigueur aux États-Unis. En cas de litige, les parties s'engagent à
        rechercher une résolution amiable. À défaut d'accord amiable, tout
        litige sera soumis à la compétence des tribunaux compétents.
      </p>

      <h2 className="text-base font-semibold text-foreground pt-4">
        Article 11 — Contact
      </h2>
      <p>
        Pour toute question relative aux présentes conditions d'utilisation,
        vous pouvez nous contacter à l'adresse : <strong>{email}</strong>
      </p>

      <p className="text-xs text-muted-foreground/70 pt-4">
        Dernière mise à jour : 6 juin 2026
      </p>
    </LegalLayout>
  );
}
