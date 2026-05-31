export const siteConfig = {
  name: "BelKou",
  logo: "/favicon/logo.png",
  tagline: "Formation apps IA & SaaS en français",
  contactEmail: import.meta.env.VITE_CONTACT_EMAIL ?? "profzoula@gmail.com",
  whatsappGroupUrl: import.meta.env.VITE_WHATSAPP_GROUP_URL ?? "",
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
