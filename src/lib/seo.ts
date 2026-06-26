import { siteConfig } from "@/lib/site-config";

export const siteUrl = siteConfig.siteUrl.replace(/\/$/, "");

export const defaultTitle = "BelKou — Cours en ligne Apps IA & SaaS";

export const defaultDescription =
  "Plateforme de formations vidéo en français : apps IA, SaaS, déploiement et monétisation. Preview gratuite, paiement flexible, communauté active.";

export function absoluteUrl(path = "/"): string {
  if (path.startsWith("http")) return path;
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

type SeoOptions = {
  title: string;
  description?: string;
  path?: string;
  ogImage?: string;
  noindex?: boolean;
};

export function seoHead(options: SeoOptions) {
  const description = options.description ?? defaultDescription;
  const canonical = absoluteUrl(options.path ?? "/");
  const ogImage = absoluteUrl(options.ogImage ?? "/og-image.svg");

  const meta = [
    { title: options.title },
    { name: "description", content: description },
    { property: "og:title", content: options.title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:url", content: canonical },
    { property: "og:image", content: ogImage },
    { property: "og:locale", content: "fr_FR" },
    { property: "og:site_name", content: siteConfig.name },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:site", content: siteConfig.social.twitter },
    { name: "twitter:title", content: options.title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: ogImage },
  ];

  if (options.noindex) {
    meta.push({ name: "robots", content: "noindex, nofollow" });
  }

  return {
    meta,
    links: [{ rel: "canonical", href: canonical }],
  };
}

export function courseJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: "Formation BelKou — Apps IA & SaaS",
    description: defaultDescription,
    provider: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteUrl,
      email: siteConfig.contactEmail,
    },
    inLanguage: "fr",
    offers: [
      {
        "@type": "Offer",
        name: "Premium",
        price: siteConfig.plans.premium.price,
        priceCurrency: "USD",
        url: absoluteUrl("/checkout?plan=premium"),
      },
      {
        "@type": "Offer",
        name: "VIP",
        price: siteConfig.plans.vip.price,
        priceCurrency: "USD",
        url: absoluteUrl("/checkout?plan=vip"),
      },
    ],
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteUrl,
    logo: absoluteUrl(siteConfig.logo),
    email: siteConfig.contactEmail,
    description: defaultDescription,
  };
}
