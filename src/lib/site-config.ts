export const siteConfig = {
  name: "BelKou",
  siteUrl: import.meta.env.VITE_SITE_URL ?? "https://belkou.online",
  logo: "/favicon/logo.png",
  tagline: "Formation apps IA & SaaS en français",
  contactEmail: import.meta.env.VITE_CONTACT_EMAIL ?? "profzoula@gmail.com",
  whatsappGroups: {
    premium:
      import.meta.env.VITE_WHATSAPP_GROUP_PREMIUM ??
      import.meta.env.VITE_WHATSAPP_GROUP_URL ??
      "https://chat.whatsapp.com/J4iP9lv5gYlHrWiLXHuNgD",
    vip:
      import.meta.env.VITE_WHATSAPP_GROUP_VIP ??
      "https://chat.whatsapp.com/GqWxIE5pfafFOB3krHd0uA",
  },
  cohortStartDate: import.meta.env.VITE_COHORT_START_DATE ?? "15 juin 2026",
  location: "USA · En ligne",
  stats: {
    studentsBase: Number(import.meta.env.VITE_STATS_STUDENTS_BASE ?? 2684),
    tools: "20+",
    rating: "4.9",
  },
  plans: {
    premium: { name: "Premium", price: 199, priceId: import.meta.env.VITE_STRIPE_PRICE_PREMIUM ?? "" },
    vip: { name: "VIP", price: 290, priceId: import.meta.env.VITE_STRIPE_PRICE_VIP ?? "" },
  },
  paymentMethods: [
    "Stripe (carte bancaire)",
    "PayPal",
    "MonCash",
    "Zelle",
    "Virement bancaire",
  ],
  manualPayment: {
    moncash: import.meta.env.VITE_MONCASH_NUMBER ?? "",
    zelle: import.meta.env.VITE_ZELLE_EMAIL ?? "",
    paypal: import.meta.env.VITE_PAYPAL_EMAIL ?? "",
    bankNote: import.meta.env.VITE_BANK_INSTRUCTIONS ?? "",
  },
  social: {
    twitter: import.meta.env.VITE_TWITTER_HANDLE ?? "@BelKou",
  },
} as const;

export type PlanId = "premium" | "vip";

export function getWhatsappGroupUrl(plan: PlanId | string | undefined): string {
  if (plan === "vip") return siteConfig.whatsappGroups.vip;
  return siteConfig.whatsappGroups.premium;
}

export function getWhatsappGroupLabel(plan: PlanId | string | undefined): string {
  return plan === "vip" ? "VIP VibeCode" : "Premium VibeCode";
}
