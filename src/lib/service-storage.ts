import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Calculator,
  Code2,
  Globe,
  GraduationCap,
  Megaphone,
} from "lucide-react";

export type ServiceIconKey =
  | "building"
  | "code"
  | "globe"
  | "calculator"
  | "megaphone"
  | "graduation";

export type ServiceActionType = "booking" | "link";

export type StoredService = {
  slug: string;
  title: string;
  description: string;
  priceLabel: string;
  rating: number;
  ratingsCount: number;
  provider: string;
  iconKey: ServiceIconKey;
  gradient: string;
  imageUrl?: string;
  premium: boolean;
  published: boolean;
  deliverables: string[];
  sortOrder: number;
  actionType: ServiceActionType;
  linkHref?: string;
  linkLabel?: string;
};

export type ServiceItem = {
  slug: string;
  title: string;
  description: string;
  priceLabel: string;
  rating: number;
  ratingsCount: number;
  provider: string;
  icon: LucideIcon;
  gradient: string;
  imageUrl?: string;
  premium?: boolean;
  deliverables: string[];
  action: { type: "booking" } | { type: "link"; href: string; label: string };
};

export const SERVICE_ICON_OPTIONS: { key: ServiceIconKey; label: string; icon: LucideIcon }[] = [
  { key: "building", label: "Entreprise", icon: Building2 },
  { key: "code", label: "Développement", icon: Code2 },
  { key: "globe", label: "Web", icon: Globe },
  { key: "calculator", label: "Fiscal", icon: Calculator },
  { key: "megaphone", label: "Marketing", icon: Megaphone },
  { key: "graduation", label: "Formation", icon: GraduationCap },
];

export const SERVICE_GRADIENT_PRESETS = [
  "from-slate-700 via-slate-800 to-slate-900",
  "from-indigo-600 via-violet-700 to-purple-800",
  "from-sky-600 via-blue-700 to-indigo-800",
  "from-emerald-600 via-teal-700 to-cyan-800",
  "from-rose-500 via-pink-600 to-fuchsia-700",
  "from-violet-600 via-indigo-600 to-blue-700",
] as const;

const iconByKey: Record<ServiceIconKey, LucideIcon> = {
  building: Building2,
  code: Code2,
  globe: Globe,
  calculator: Calculator,
  megaphone: Megaphone,
  graduation: GraduationCap,
};

export function getServiceIcon(key: ServiceIconKey): LucideIcon {
  return iconByKey[key] ?? Building2;
}

export function slugifyServiceTitle(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export type SerializableService = Omit<ServiceItem, "icon"> & { iconKey: ServiceIconKey };

export function storedServiceToSerializable(stored: StoredService): SerializableService {
  const item = storedServiceToItem(stored);
  const { icon: _icon, ...rest } = item;
  return { ...rest, iconKey: stored.iconKey };
}

export function serializableToServiceItem(service: SerializableService): ServiceItem {
  const { iconKey, ...rest } = service;
  return { ...rest, icon: getServiceIcon(iconKey) };
}

export function storedServiceToItem(stored: StoredService): ServiceItem {
  return {
    slug: stored.slug,
    title: stored.title,
    description: stored.description,
    priceLabel: stored.priceLabel,
    rating: stored.rating,
    ratingsCount: stored.ratingsCount,
    provider: stored.provider,
    icon: getServiceIcon(stored.iconKey),
    gradient: stored.gradient,
    imageUrl: stored.imageUrl?.trim() || undefined,
    premium: stored.premium,
    deliverables: stored.deliverables,
    action:
      stored.actionType === "link"
        ? {
            type: "link",
            href: stored.linkHref?.trim() || "/courses",
            label: stored.linkLabel?.trim() || "Plus de détails",
          }
        : { type: "booking" },
  };
}

export function getDefaultServices(): StoredService[] {
  return [
    {
      slug: "creation-llc",
      title: "Création LLC",
      description:
        "Lancez votre entreprise aux États-Unis avec un accompagnement complet pour la création de LLC.",
      priceLabel: "$350",
      rating: 5,
      ratingsCount: 234,
      provider: "Équipe BelKou",
      iconKey: "building",
      gradient: SERVICE_GRADIENT_PRESETS[0],
      premium: true,
      published: true,
      sortOrder: 0,
      actionType: "booking",
      deliverables: [
        "Préparation et dépôt des documents LLC",
        "Obtention du numéro EIN (Employer ID)",
        "Operating Agreement personnalisé",
        "Consultation sur la structure juridique",
        "Support pour ouvrir un compte bancaire professionnel",
      ],
    },
    {
      slug: "developpement-app",
      title: "Développement App",
      description:
        "Développement d'applications mobiles et web sur mesure pour transformer vos idées en produits.",
      priceLabel: "$1,300 – $30,000",
      rating: 4.9,
      ratingsCount: 456,
      provider: "Équipe BelKou",
      iconKey: "code",
      gradient: SERVICE_GRADIENT_PRESETS[1],
      premium: true,
      published: true,
      sortOrder: 1,
      actionType: "booking",
      deliverables: [
        "Cahier des charges et maquettes",
        "Développement web ou mobile sur mesure",
        "Intégration API, auth et paiements",
        "Tests, déploiement et documentation",
        "Support post-lancement (selon forfait)",
      ],
    },
    {
      slug: "creation-site-web",
      title: "Création Site Web",
      description: "Sites web modernes, responsives et optimisés pour convertir les visiteurs en clients.",
      priceLabel: "$650 – $6,500",
      rating: 4.9,
      ratingsCount: 389,
      provider: "Équipe BelKou",
      iconKey: "globe",
      gradient: SERVICE_GRADIENT_PRESETS[2],
      premium: true,
      published: true,
      sortOrder: 2,
      actionType: "booking",
      deliverables: [
        "Design responsive et moderne",
        "Pages clés (accueil, services, contact…)",
        "Optimisation SEO de base",
        "Formulaire de contact et analytics",
        "Mise en ligne sur votre domaine",
      ],
    },
    {
      slug: "declaration-impots",
      title: "Déclaration d'Impôts",
      description: "Service professionnel de déclaration fiscale pour entrepreneurs et entreprises.",
      priceLabel: "$200",
      rating: 5,
      ratingsCount: 178,
      provider: "Équipe BelKou",
      iconKey: "calculator",
      gradient: SERVICE_GRADIENT_PRESETS[3],
      premium: true,
      published: true,
      sortOrder: 3,
      actionType: "booking",
      deliverables: [
        "Revue de vos documents fiscaux",
        "Préparation de la déclaration",
        "Conseils pour entrepreneurs LLC",
        "Soumission et suivi",
        "Support par email pendant le processus",
      ],
    },
    {
      slug: "marketing-digital",
      title: "Marketing Digital",
      description: "Stratégie marketing complète : SEO, publicité, réseaux sociaux et bien plus encore.",
      priceLabel: "$250",
      rating: 4.8,
      ratingsCount: 523,
      provider: "Équipe BelKou",
      iconKey: "megaphone",
      gradient: SERVICE_GRADIENT_PRESETS[4],
      premium: true,
      published: true,
      sortOrder: 4,
      actionType: "booking",
      deliverables: [
        "Audit de votre présence en ligne",
        "Plan marketing sur mesure",
        "Setup publicités (Meta, Google…)",
        "Calendrier éditorial réseaux sociaux",
        "Rapport mensuel des performances",
      ],
    },
    {
      slug: "formation",
      title: "Formation",
      description: "Formations pratiques pour maîtriser les outils et stratégies du business numérique.",
      priceLabel: "Voir le catalogue",
      rating: 4.9,
      ratingsCount: 1234,
      provider: "Équipe BelKou",
      iconKey: "graduation",
      gradient: SERVICE_GRADIENT_PRESETS[5],
      premium: true,
      published: true,
      sortOrder: 5,
      actionType: "link",
      linkHref: "/courses",
      linkLabel: "Plus de détails",
      deliverables: [
        "Cours vidéo en français",
        "Preview gratuite avant inscription",
        "Progression sauvegardée",
        "Accès à vie par cours acheté",
        "Communauté d'entrepreneurs",
      ],
    },
  ];
}

export type ServicePatch = Partial<
  Omit<StoredService, "slug" | "sortOrder"> & {
    deliverablesText?: string;
  }
>;

export function patchStoredService(service: StoredService, patch: ServicePatch): StoredService {
  const deliverables =
    patch.deliverables ??
    (patch.deliverablesText !== undefined
      ? patch.deliverablesText
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
      : undefined);

  return {
    ...service,
    ...(patch.title !== undefined && { title: patch.title }),
    ...(patch.description !== undefined && { description: patch.description }),
    ...(patch.priceLabel !== undefined && { priceLabel: patch.priceLabel }),
    ...(patch.rating !== undefined && { rating: patch.rating }),
    ...(patch.ratingsCount !== undefined && { ratingsCount: patch.ratingsCount }),
    ...(patch.provider !== undefined && { provider: patch.provider }),
    ...(patch.iconKey !== undefined && { iconKey: patch.iconKey }),
    ...(patch.gradient !== undefined && { gradient: patch.gradient }),
    ...(patch.imageUrl !== undefined && { imageUrl: patch.imageUrl.trim() || undefined }),
    ...(patch.premium !== undefined && { premium: patch.premium }),
    ...(patch.published !== undefined && { published: patch.published }),
    ...(deliverables !== undefined && { deliverables }),
    ...(patch.actionType !== undefined && { actionType: patch.actionType }),
    ...(patch.linkHref !== undefined && { linkHref: patch.linkHref }),
    ...(patch.linkLabel !== undefined && { linkLabel: patch.linkLabel }),
  };
}

export type CreateServiceInput = {
  title: string;
  slug?: string;
  description?: string;
  priceLabel?: string;
};

export function buildNewService(input: CreateServiceInput, existing: StoredService[]): StoredService {
  const baseSlug = input.slug?.trim() || slugifyServiceTitle(input.title);
  let slug = baseSlug;
  let suffix = 1;
  while (existing.some((service) => service.slug === slug)) {
    slug = `${baseSlug}-${suffix++}`;
  }

  const maxOrder = existing.reduce((max, service) => Math.max(max, service.sortOrder), -1);

  return {
    slug,
    title: input.title.trim(),
    description: input.description?.trim() || "Description du service à compléter.",
    priceLabel: input.priceLabel?.trim() || "Sur devis",
    rating: 5,
    ratingsCount: 0,
    provider: "Équipe BelKou",
    iconKey: "building",
    gradient: SERVICE_GRADIENT_PRESETS[0],
    premium: true,
    published: false,
    sortOrder: maxOrder + 1,
    actionType: "booking",
    deliverables: ["Consultation initiale", "Accompagnement personnalisé"],
  };
}
