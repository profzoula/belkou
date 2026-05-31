import { siteConfig } from "@/lib/site-config";

export type PlanId = "premium" | "vip";

export type PlanDetail = {
  id: PlanId;
  name: string;
  price: number;
  desc: string;
  features: string[];
  badge?: string;
  highlight?: boolean;
};

const premiumFeatures = [
  "Accès complet à la formation",
  "Groupe WhatsApp Premium VibeCode",
  "Code source complet",
  "Templates et ressources",
  "Support communautaire",
];

export const planDetails: Record<PlanId, PlanDetail> = {
  premium: {
    id: "premium",
    name: siteConfig.plans.premium.name,
    price: siteConfig.plans.premium.price,
    desc: "Tout ce qu'il faut pour apprendre et lancer votre projet",
    features: premiumFeatures,
    badge: "Populaire",
    highlight: true,
  },
  vip: {
    id: "vip",
    name: siteConfig.plans.vip.name,
    price: siteConfig.plans.vip.price,
    desc: "Tout le Premium + accompagnement personnel sur votre projet",
    features: [
      "Tout ce qui est inclus dans Premium",
      "Groupe WhatsApp VIP VibeCode",
      "Ebook gratuit",
      "Assistance personnelle du formateur",
      "Aide directe pendant la réalisation de votre projet",
      "Revue et conseils sur votre travail",
    ],
    badge: "Accompagnement 1-on-1",
    highlight: false,
  },
};

export const pricingPlans = [planDetails.premium, planDetails.vip];

export function getPlanDetail(planId: PlanId | string | undefined): PlanDetail {
  if (planId === "vip") return planDetails.vip;
  return planDetails.premium;
}
