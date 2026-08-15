import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Linkedin, Mail, Phone } from "lucide-react";
import { formatWhatsAppPhone, getWhatsAppChatUrl, siteConfig } from "@/lib/site-config";

const socialLinks = [
  { label: "Facebook", href: siteConfig.founder.facebookUrl, icon: Facebook },
  { label: "LinkedIn", href: siteConfig.founder.linkedinUrl, icon: Linkedin },
  { label: "Instagram", href: siteConfig.founder.instagramUrl, icon: Instagram },
].filter((item) => Boolean(item.href));

export function PromoTopbar() {
  useEffect(() => {
    document.documentElement.classList.remove("no-promo");
  }, []);

  const phone = formatWhatsAppPhone();
  const phoneHref = getWhatsAppChatUrl();
  const email = siteConfig.contactEmail;

  return (
    <div className="promo-topbar text-white">
      <div className="site-container flex h-9 items-center justify-between gap-3 text-[11px] leading-none sm:h-10 sm:text-xs">
        <p className="min-w-0 truncate font-medium text-white/85">
          <span className="sm:hidden">
            Cours BelKou —{" "}
            <span className="font-semibold text-brand-accent">inscriptions ouvertes</span>
          </span>
          <span className="hidden sm:inline">
            Parcours de formation en ligne —{" "}
            <span className="font-semibold text-brand-accent">inscriptions ouvertes</span>
          </span>
          <Link
            to="/courses"
            className="ml-1.5 inline font-semibold text-white underline-offset-2 hover:underline"
          >
            Voir les cours →
          </Link>
        </p>

        <div className="hidden items-center gap-5 md:flex">
          <a
            href={phoneHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-white/90 transition hover:text-white"
          >
            <Phone className="size-3.5 text-brand-accent" aria-hidden />
            <span>{phone}</span>
          </a>
          <a
            href={`mailto:${email}`}
            className="inline-flex items-center gap-1.5 text-white/90 transition hover:text-white"
          >
            <Mail className="size-3.5 text-brand-accent" aria-hidden />
            <span>{email}</span>
          </a>
        </div>

        {socialLinks.length > 0 ? (
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {socialLinks.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={item.label}
                  className="inline-flex size-7 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
                >
                  <Icon className="size-3.5" aria-hidden />
                </a>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
