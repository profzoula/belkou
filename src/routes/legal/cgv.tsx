import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, legalSections } from "@/components/site/LegalLayout";
import { siteConfig } from "@/lib/site-config";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/legal/cgv")({
  head: () =>
    seoHead({
      title: "Conditions générales de vente — BelKou",
      description:
        "CGV BelKou : tarifs, accès à la formation, remboursements et modalités de paiement.",
      path: "/legal/cgv",
    }),
  component: CgvPage,
});

function CgvPage() {
  const { siteName, email } = legalSections();
  return (
    <LegalLayout title="Conditions générales de vente">
      <p>
        Les présentes conditions générales de vente (ci-après « CGV ») régissent
        les relations contractuelles entre <strong>{siteName}</strong> et toute
        personne physique ou morale (ci-après « le Client ») souhaitant
        s'inscrire à la formation proposée sur le site{" "}
        <strong>{siteConfig.siteUrl}</strong>. Toute inscription implique
        l'acceptation sans réserve des présentes CGV.
      </p>

      <h2 className="text-base font-semibold text-foreground pt-4">
        Article 1 — Objet
      </h2>
      <p>
        Les présentes CGV ont pour objet de définir les conditions dans
        lesquelles {siteName} propose ses services de formation en ligne
        spécialisée dans le développement d'applications utilisant
        l'intelligence artificielle (IA) et les technologies SaaS (Software as a
        Service). La formation est dispensée en français, sous forme de cohorte,
        avec un programme structuré sur une durée recommandée de{" "}
        {siteConfig.formation.durationRecommended}.
      </p>

      <h2 className="text-base font-semibold text-foreground pt-4">
        Article 2 — Plans et tarifs
      </h2>
      <p>{siteName} propose deux formules d'inscription :</p>
      <h3 className="text-sm font-semibold text-foreground pt-2">
        2.1 — Plan {siteConfig.plans.premium.name} (${siteConfig.plans.premium.price} USD)
      </h3>
      <p>
        Le plan {siteConfig.plans.premium.name} comprend l'accès complet à
        l'ensemble des modules de la formation, aux supports de cours, aux
        exercices pratiques, ainsi qu'à un groupe WhatsApp dédié pour
        l'entraide entre participants. Ce plan est conçu pour les apprenants
        autonomes qui souhaitent suivre la formation à leur rythme avec le
        support de la communauté.
      </p>
      <h3 className="text-sm font-semibold text-foreground pt-2">
        2.2 — Plan {siteConfig.plans.vip.name} (${siteConfig.plans.vip.price} USD)
      </h3>
      <p>
        Le plan {siteConfig.plans.vip.name} comprend tout le contenu du plan{" "}
        {siteConfig.plans.premium.name}, ainsi qu'un accompagnement
        personnalisé incluant du mentorat individuel, une revue de projet et un
        accès prioritaire au formateur. Ce plan est destiné aux personnes
        souhaitant un suivi rapproché et un retour personnalisé sur leurs
        réalisations.
      </p>
      <p>
        Les prix sont indiqués en dollars américains (USD) et sont fermes et
        définitifs au moment de l'inscription. {siteName} se réserve le droit
        de modifier ses tarifs pour les futures cohortes.
      </p>

      <h2 className="text-base font-semibold text-foreground pt-4">
        Article 3 — Inscription et paiement
      </h2>
      <p>
        L'inscription à la formation s'effectue via le formulaire disponible sur
        le site <strong>{siteConfig.siteUrl}</strong>. Le Client remplit ses
        informations personnelles (nom, email, numéro WhatsApp, pays, niveau
        d'expérience) et sélectionne le plan souhaité.
      </p>
      <p>Le paiement peut être effectué par les moyens suivants :</p>
      <ul className="list-disc list-inside space-y-1">
        {siteConfig.paymentMethods.map((method) => (
          <li key={method}>{method}</li>
        ))}
      </ul>
      <p>
        L'inscription n'est considérée comme définitive qu'après réception
        et confirmation du paiement intégral par {siteName}. En cas de paiement
        manuel (MonCash, Zelle, PayPal, virement), le Client recevra un email de
        confirmation une fois le paiement vérifié par l'équipe.
      </p>

      <h2 className="text-base font-semibold text-foreground pt-4">
        Article 4 — Accès à la formation
      </h2>
      <p>
        Après confirmation du paiement, le Client reçoit par email les
        informations d'accès à la formation, incluant le lien d'invitation au
        groupe WhatsApp correspondant à son plan. La formation débute à la date
        de la cohorte en cours ({siteConfig.cohortStartDate}). L'accès au
        contenu est personnel et non transférable.
      </p>

      <h2 className="text-base font-semibold text-foreground pt-4">
        Article 5 — Politique de remboursement
      </h2>
      <p>
        <strong>Aucun remboursement n'est accordé</strong> une fois
        l'inscription confirmée et le paiement traité. En raison de la nature
        numérique du service et de l'accès immédiat au contenu de la formation,
        le Client reconnaît renoncer expressément à son droit de rétractation
        conformément aux dispositions applicables. Le Client est invité à
        vérifier soigneusement le plan choisi avant de procéder au paiement.
      </p>

      <h2 className="text-base font-semibold text-foreground pt-4">
        Article 6 — Mentorat VIP
      </h2>
      <p>
        Les Clients ayant souscrit au plan {siteConfig.plans.vip.name}{" "}
        bénéficient d'un accompagnement personnalisé comprenant :
      </p>
      <ul className="list-disc list-inside space-y-1">
        <li>Des sessions de mentorat individuel avec le formateur</li>
        <li>Une revue détaillée de leur projet de formation</li>
        <li>Un accès prioritaire aux questions et au support</li>
        <li>Un accès au groupe WhatsApp VIP exclusif</li>
      </ul>
      <p>
        Les modalités exactes du mentorat (fréquence, durée des sessions) sont
        communiquées au Client après son inscription. Le mentorat est valable
        pour la durée de la cohorte en cours et ne peut être reporté sur une
        cohorte ultérieure sauf accord préalable de {siteName}.
      </p>

      <h2 className="text-base font-semibold text-foreground pt-4">
        Article 7 — Propriété intellectuelle
      </h2>
      <p>
        L'ensemble des contenus de la formation (vidéos, documents, exercices,
        codes sources, supports pédagogiques) est protégé par le droit de la
        propriété intellectuelle et reste la propriété exclusive de {siteName}.
        Toute reproduction, redistribution, revente, diffusion publique ou
        exploitation commerciale du contenu, en totalité ou en partie, est
        strictement interdite sans l'autorisation écrite préalable de{" "}
        {siteName}.
      </p>

      <h2 className="text-base font-semibold text-foreground pt-4">
        Article 8 — Responsabilité
      </h2>
      <p>
        {siteName} s'engage à fournir la formation avec diligence et dans le
        respect d'une obligation de moyens. {siteName} ne saurait être tenu
        responsable de l'échec ou de l'insatisfaction du Client quant aux
        résultats obtenus. La formation est fournie « en l'état » et{" "}
        {siteName} ne garantit aucun résultat spécifique en termes d'emploi, de
        revenus ou de compétences acquises.
      </p>
      <p>
        En aucun cas, la responsabilité de {siteName} ne pourra excéder le
        montant total payé par le Client pour sa formation.
      </p>

      <h2 className="text-base font-semibold text-foreground pt-4">
        Article 9 — Force majeure
      </h2>
      <p>
        {siteName} ne pourra être tenu responsable de l'inexécution totale ou
        partielle de ses obligations si cette inexécution est due à un événement
        de force majeure, notamment : catastrophe naturelle, pandémie, panne de
        service internet, défaillance technique majeure, grève, conflit armé, ou
        tout autre événement imprévisible, irrésistible et extérieur aux
        parties.
      </p>

      <h2 className="text-base font-semibold text-foreground pt-4">
        Article 10 — Droit applicable
      </h2>
      <p>
        Les présentes CGV sont régies par le droit en vigueur aux États-Unis.
        En cas de litige relatif à l'interprétation ou à l'exécution des
        présentes CGV, les parties s'engagent à rechercher une solution amiable.
        À défaut d'accord amiable, tout litige sera soumis aux tribunaux
        compétents.
      </p>

      <h2 className="text-base font-semibold text-foreground pt-4">
        Article 11 — Modification des CGV
      </h2>
      <p>
        {siteName} se réserve le droit de modifier les présentes CGV à tout
        moment. Les modifications entrent en vigueur dès leur publication sur le
        site. Les Clients inscrits seront informés par email de toute
        modification substantielle. Les CGV applicables sont celles en vigueur
        au moment de l'inscription du Client.
      </p>

      <h2 className="text-base font-semibold text-foreground pt-4">
        Contact
      </h2>
      <p>
        Pour toute question relative aux présentes CGV, vous pouvez nous
        contacter à l'adresse : <strong>{email}</strong>
      </p>

      <p className="text-xs text-muted-foreground/70 pt-4">
        Dernière mise à jour : 6 juin 2026
      </p>
    </LegalLayout>
  );
}
