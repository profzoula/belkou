import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, legalSections } from "@/components/site/LegalLayout";
import { siteConfig } from "@/lib/site-config";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/legal/privacy")({
  head: () =>
    seoHead({
      title: "Politique de confidentialité — BelKou",
      description:
        "Politique de confidentialité BelKou : données collectées, utilisation et vos droits.",
      path: "/legal/privacy",
    }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const { siteName, email } = legalSections();
  return (
    <LegalLayout title="Politique de confidentialité">
      <p>
        <strong>{siteName}</strong> respecte votre vie privée et s'engage à
        protéger vos données personnelles. La présente politique de
        confidentialité explique quelles données nous collectons, pourquoi et
        comment nous les utilisons, ainsi que les droits dont vous disposez
        concernant vos informations.
      </p>

      <h2 className="text-base font-semibold text-foreground pt-4">
        Article 1 — Données collectées
      </h2>
      <p>
        Lors de votre inscription à la formation, nous collectons les données
        suivantes :
      </p>
      <ul className="list-disc list-inside space-y-1">
        <li>Nom complet</li>
        <li>Adresse email</li>
        <li>Numéro WhatsApp</li>
        <li>Pays de résidence</li>
        <li>Niveau d'expérience (débutant, intermédiaire, avancé)</li>
        <li>Plan choisi ({siteConfig.plans.premium.name} ou {siteConfig.plans.vip.name})</li>
      </ul>
      <p>
        Ces données sont collectées directement auprès de vous via le formulaire
        d'inscription. Nous ne collectons aucune donnée sensible (origine
        ethnique, opinions politiques, données de santé, etc.).
      </p>

      <h2 className="text-base font-semibold text-foreground pt-4">
        Article 2 — Base légale du traitement
      </h2>
      <p>Le traitement de vos données repose sur les bases légales suivantes :</p>
      <ul className="list-disc list-inside space-y-1">
        <li>
          <strong>Consentement</strong> : vous consentez au traitement de vos
          données en remplissant le formulaire d'inscription et en acceptant
          les conditions du service.
        </li>
        <li>
          <strong>Exécution du contrat</strong> : le traitement est nécessaire
          pour fournir les services de formation auxquels vous avez souscrit,
          gérer votre inscription et traiter votre paiement.
        </li>
        <li>
          <strong>Obligations légales</strong> : certaines données sont
          conservées pour répondre aux obligations comptables et fiscales
          applicables.
        </li>
      </ul>

      <h2 className="text-base font-semibold text-foreground pt-4">
        Article 3 — Utilisation des données
      </h2>
      <p>Vos données personnelles sont utilisées pour :</p>
      <ul className="list-disc list-inside space-y-1">
        <li>Gérer votre inscription et votre accès à la formation</li>
        <li>Traiter et confirmer les paiements</li>
        <li>Vous envoyer les informations d'accès (email de bienvenue, lien WhatsApp)</li>
        <li>Communiquer avec vous concernant la formation (annonces, mises à jour, support)</li>
        <li>Améliorer nos services et l'expérience utilisateur</li>
        <li>Respecter nos obligations légales et comptables</li>
      </ul>

      <h2 className="text-base font-semibold text-foreground pt-4">
        Article 4 — Partage des données
      </h2>
      <p>
        Nous ne vendons jamais vos données personnelles. Cependant, nous
        partageons certaines données avec les prestataires techniques suivants,
        strictement nécessaires au fonctionnement du service :
      </p>
      <ul className="list-disc list-inside space-y-1">
        <li>
          <strong>Stripe</strong> : processeur de paiement par carte bancaire
          (données de paiement uniquement)
        </li>
        <li>
          <strong>Resend</strong> : service d'envoi d'emails transactionnels
          (email de confirmation, accès formation)
        </li>
        <li>
          <strong>Supabase</strong> : hébergement de la base de données
          (stockage sécurisé des inscriptions)
        </li>
        <li>
          <strong>Cloudflare</strong> : hébergement du site web et protection
          contre les attaques
        </li>
      </ul>
      <p>
        Ces prestataires s'engagent à traiter vos données de manière
        confidentielle et conformément à leurs politiques de confidentialité
        respectives.
      </p>

      <h2 className="text-base font-semibold text-foreground pt-4">
        Article 5 — Durée de conservation
      </h2>
      <p>
        Vos données personnelles sont conservées pendant toute la durée de
        votre relation commerciale avec {siteName}, puis pendant la durée
        nécessaire au respect de nos obligations légales (comptabilité,
        fiscalité). Les données de paiement sont conservées conformément aux
        obligations légales applicables. Au-delà de ces périodes, vos données
        sont supprimées ou anonymisées.
      </p>

      <h2 className="text-base font-semibold text-foreground pt-4">
        Article 6 — Cookies
      </h2>
      <p>
        Le site {siteName} utilise uniquement des <strong>cookies techniques</strong>{" "}
        nécessaires au fonctionnement du service :
      </p>
      <ul className="list-disc list-inside space-y-1">
        <li>Cookies d'authentification (session administrateur)</li>
        <li>Cookies de préférences (thème clair/sombre)</li>
      </ul>
      <p>
        Nous n'utilisons aucun cookie de suivi, de publicité ou d'analyse
        comportementale. Aucun cookie tiers n'est déposé à des fins de
        marketing.
      </p>

      <h2 className="text-base font-semibold text-foreground pt-4">
        Article 7 — Vos droits
      </h2>
      <p>
        Conformément à la réglementation applicable en matière de protection des
        données, vous disposez des droits suivants :
      </p>
      <ul className="list-disc list-inside space-y-1">
        <li>
          <strong>Droit d'accès</strong> : obtenir une copie de vos données
          personnelles
        </li>
        <li>
          <strong>Droit de rectification</strong> : corriger des données
          inexactes ou incomplètes
        </li>
        <li>
          <strong>Droit de suppression</strong> : demander l'effacement de vos
          données (sous réserve des obligations légales)
        </li>
        <li>
          <strong>Droit à la portabilité</strong> : recevoir vos données dans un
          format structuré et lisible par machine
        </li>
        <li>
          <strong>Droit d'opposition</strong> : vous opposer au traitement de
          vos données dans certains cas
        </li>
      </ul>
      <p>
        Pour exercer l'un de ces droits, contactez-nous à l'adresse :{" "}
        <strong>{email}</strong>. Nous répondrons dans un délai de 30 jours.
      </p>

      <h2 className="text-base font-semibold text-foreground pt-4">
        Article 8 — Sécurité
      </h2>
      <p>
        Nous mettons en œuvre des mesures de sécurité techniques et
        organisationnelles appropriées pour protéger vos données personnelles
        contre tout accès non autorisé, perte, altération ou divulgation.
        Ces mesures incluent :
      </p>
      <ul className="list-disc list-inside space-y-1">
        <li>Chiffrement des données en transit (HTTPS/TLS)</li>
        <li>Accès restreint aux données (authentification requise)</li>
        <li>Hébergement sur des infrastructures sécurisées et certifiées</li>
        <li>Mises à jour régulières des dépendances logicielles</li>
      </ul>

      <h2 className="text-base font-semibold text-foreground pt-4">
        Article 9 — Transferts internationaux
      </h2>
      <p>
        Vos données sont hébergées sur des infrastructures cloud sécurisées
        pouvant être situées en dehors de votre pays de résidence (notamment
        aux États-Unis et en Europe). Nos prestataires (Supabase, Cloudflare,
        Stripe, Resend) garantissent un niveau de protection adéquat
        conformément aux standards internationaux en matière de protection des
        données.
      </p>

      <h2 className="text-base font-semibold text-foreground pt-4">
        Article 10 — Modifications
      </h2>
      <p>
        {siteName} se réserve le droit de modifier la présente politique de
        confidentialité à tout moment. Toute modification significative sera
        notifiée aux utilisateurs inscrits par email. La version en vigueur est
        celle publiée sur le site. Nous vous encourageons à consulter
        régulièrement cette page.
      </p>

      <h2 className="text-base font-semibold text-foreground pt-4">
        Article 11 — Contact
      </h2>
      <p>
        Pour toute question concernant la présente politique de confidentialité
        ou le traitement de vos données personnelles, vous pouvez nous contacter
        à l'adresse : <strong>{email}</strong>
      </p>

      <p className="text-xs text-muted-foreground/70 pt-4">
        Dernière mise à jour : 6 juin 2026
      </p>
    </LegalLayout>
  );
}
