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
  "Groupe WhatsApp Formation VibeCode",
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
    badge: "Un cours",
    highlight: false,
  },
  vip: {
    id: "vip",
    name: siteConfig.plans.vip.name,
    price: siteConfig.plans.vip.price,
    desc: "Accès illimité à tous les cours et à tous les lives",
    features: [
      "Tous les cours BelKou, à vie",
      "Tous les lives et replays inclus",
      "Nouveaux cours ajoutés sans frais",
      "Groupe WhatsApp Formation VibeCode",
      "Assistance personnelle du formateur",
    ],
    badge: "Accès illimité",
    highlight: true,
  },
};

export const pricingPlans = [planDetails.premium, planDetails.vip];

export function getPlanDetail(planId: PlanId | string | undefined): PlanDetail {
  if (planId === "vip") return planDetails.vip;
  return planDetails.premium;
}
