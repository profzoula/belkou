import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import { SiteLogo } from "@/components/site/SiteLogo";
import { siteConfig, formatWhatsAppPhone, getWhatsAppChatUrl } from "@/lib/site-config";

type FooterLink = {
  name: string;
  href: string;
  external?: boolean;
};

type FooterColumn = {
  title: string;
  items: FooterLink[];
};

const footerColumns: FooterColumn[] = [
  {
    title: "Formations",
    items: [
      { name: "Tous les cours", href: "/courses" },
      { name: "Services", href: "/services" },
      { name: "Tableau de bord", href: "/dashboard" },
      { name: "Créer un compte", href: "/signup" },
    ],
  },
  {
    title: "Entreprise",
    items: [
      { name: "Comment ça marche", href: "/#how-it-works" },
      { name: "Témoignages", href: "/#testimonials" },
      { name: "FAQ", href: "/faq" },
      { name: "Contact", href: `mailto:${siteConfig.contactEmail}` },
    ],
  },
  {
    title: "Ressources",
    items: [
      { name: "Connexion", href: "/login" },
      { name: "Confidentialité", href: "/legal/privacy" },
      { name: "Conditions", href: "/legal/terms" },
      { name: "CGV", href: "/legal/cgv" },
    ],
  },
];

const legalLinks: FooterLink[] = [
  { name: "Confidentialité", href: "/legal/privacy" },
  { name: "Conditions", href: "/legal/terms" },
  { name: "CGV", href: "/legal/cgv" },
  { name: "Contact", href: `mailto:${siteConfig.contactEmail}` },
];

const twitterHandle = siteConfig.social.twitter.replace(/^@/, "");
const twitterUrl = `https://x.com/${twitterHandle}`;

const iconShell =
  "flex size-9 items-center justify-center rounded-full border border-zinc-200 bg-zinc-100 transition-colors hover:bg-zinc-50";

const contactIconShell =
  "flex size-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-100";

function FooterNavLink({ item }: { item: FooterLink }) {
  const className = "text-sm text-zinc-500 transition-colors hover:text-zinc-700";

  if (item.href.startsWith("/") && !item.href.startsWith("//") && !item.href.includes("#")) {
    return (
      <Link to={item.href} className={className}>
        {item.name}
      </Link>
    );
  }

  if (item.href.startsWith("mailto:") || item.external) {
    return (
      <a href={item.href} className={className} {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {item.name}
      </a>
    );
  }

  return (
    <a href={item.href} className={className}>
      {item.name}
    </a>
  );
}

function SocialXIcon() {
  return (
    <svg width="18" height="17" viewBox="0 0 18 17" fill="none" aria-hidden>
      <path
        d="m5.44.5 3.777 4.994.37.49.405-.463L14.385.5h1.428l-5.296 6.054-.269.306.246.325 6.479 8.565h-4.296l-4.195-5.484-.37-.486-.403.46-4.822 5.51h-1.43l5.716-6.533.27-.308-.25-.325L1.012.5zM2.822 1.867l9.972 13.036.15.197h2.78l-.607-.801-9.86-13.037-.15-.199h-2.9z"
        fill="#000"
        stroke="#90a1b9"
      />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"
        fill="#45556c"
      />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M16.667 8.335c0 4.16-4.616 8.494-6.166 9.832a.83.83 0 0 1-1.002 0c-1.55-1.338-6.166-5.672-6.166-9.832a6.667 6.667 0 0 1 13.334 0"
        stroke="#45556c"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.5 8.335 9.167 10 12.5 6.668"
        stroke="#45556c"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 19 19" fill="none" aria-hidden>
      <path
        d="M10.95 13.115a.79.79 0 0 0 .96-.24l.282-.368a1.58 1.58 0 0 1 1.266-.633h2.375a1.583 1.583 0 0 1 1.584 1.583v2.375a1.583 1.583 0 0 1-1.584 1.583 14.25 14.25 0 0 1-14.25-14.25 1.583 1.583 0 0 1 1.584-1.583h2.375a1.583 1.583 0 0 1 1.583 1.583V5.54a1.58 1.58 0 0 1-.633 1.267l-.37.278a.79.79 0 0 0-.232.976 11.1 11.1 0 0 0 5.06 5.054"
        stroke="#45556c"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="m18.333 5.832-7.492 4.773a1.67 1.67 0 0 1-1.674 0l-7.5-4.773"
        stroke="#45556c"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.667 3.332H3.333c-.92 0-1.666.746-1.666 1.667v10c0 .92.746 1.666 1.666 1.666h13.334c.92 0 1.666-.746 1.666-1.666v-10c0-.92-.746-1.667-1.666-1.667"
        stroke="#45556c"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ContactBlock({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-1 items-start gap-2.5">
      <div className={contactIconShell}>{icon}</div>
      <div>
        <h4 className="mb-0.5 text-base font-medium text-zinc-800">{title}</h4>
        <div className="text-sm leading-relaxed text-zinc-500">{children}</div>
      </div>
    </div>
  );
}

export function Footer() {
  const year = new Date().getFullYear();
  const whatsappUrl = getWhatsAppChatUrl();
  const whatsappLabel = formatWhatsAppPhone();

  return (
    <footer className="bg-zinc-50 px-4 pb-[env(safe-area-inset-bottom,0px)] pt-16 sm:px-6 md:px-8 lg:px-20">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-16 pb-12 lg:flex-row">
          <div className="max-w-full flex-1 lg:max-w-[400px]">
            <Link to="/" className="mb-6 inline-flex items-center gap-3">
              <SiteLogo className="h-10 w-10" alt={siteConfig.name} />
              <span className="font-display text-lg font-bold text-zinc-900">{siteConfig.name}</span>
            </Link>
            <p className="mb-7 max-w-80 text-sm leading-7 text-zinc-500">
              {siteConfig.tagline}. Formations vidéo en français pour créer des apps IA, des SaaS et
              monétiser en ligne — Haïti, diaspora & monde entier.
            </p>
            <div className="flex gap-4">
              <a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={iconShell}
                aria-label="X (Twitter)"
              >
                <SocialXIcon />
              </a>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={iconShell}
                aria-label="WhatsApp BelKou"
              >
                <WhatsAppIcon />
              </a>
              <a href={`mailto:${siteConfig.contactEmail}`} className={iconShell} aria-label="Email BelKou">
                <Mail className="h-4 w-4 text-zinc-600" strokeWidth={1.75} />
              </a>
            </div>
          </div>

          <div className="flex w-full max-w-3xl flex-1 flex-wrap justify-between gap-8 sm:flex-nowrap">
            {footerColumns.map((column) => (
              <div key={column.title}>
                <h3 className="mb-6 text-base font-medium text-zinc-800">{column.title}</h3>
                <ul className="flex list-none flex-col gap-3">
                  {column.items.map((item) => (
                    <li key={item.name}>
                      <FooterNavLink item={item} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="flex max-w-6xl flex-col gap-6 py-9 md:flex-row md:gap-16">
          <ContactBlock icon={<LocationIcon />} title="Localisation">
            <p>
              Formation 100 % en ligne
              <br />
              {siteConfig.location}
            </p>
          </ContactBlock>
          <ContactBlock icon={<PhoneIcon />} title="WhatsApp">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-zinc-700"
            >
              {whatsappLabel}
            </a>
          </ContactBlock>
          <ContactBlock icon={<MailIcon />} title="Email">
            <a
              href={`mailto:${siteConfig.contactEmail}`}
              className="break-all transition-colors hover:text-zinc-700"
            >
              {siteConfig.contactEmail}
            </a>
          </ContactBlock>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-zinc-300 py-4 md:flex-row">
          <p className="text-sm text-zinc-500">
            © {year} {siteConfig.name}. Tous droits réservés.
          </p>
          <div className="flex flex-wrap justify-center gap-5 md:gap-9">
            {legalLinks.map((item) => (
              <FooterNavLink key={item.name} item={item} />
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
