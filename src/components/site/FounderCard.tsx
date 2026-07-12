import type { ReactNode } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  formatWhatsAppPhone,
  getWhatsAppChatUrl,
  siteConfig,
} from "@/lib/site-config";
import { cn } from "@/lib/utils";

type FounderCardProps = {
  variant?: "default" | "featured";
};

function SocialLink({
  href,
  label,
  children,
  className,
  showLabel = false,
}: {
  href: string;
  label: string;
  children: ReactNode;
  className?: string;
  showLabel?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={cn(
        showLabel
          ? "inline-flex items-center gap-2 rounded-full border border-border/80 bg-background px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/30 hover:bg-primary/5"
          : "inline-flex h-10 w-10 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/10",
        className,
      )}
    >
      {children}
      {showLabel ? <span>{label}</span> : null}
    </a>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"
        fill="currentColor"
      />
    </svg>
  );
}

function FounderSocialLinks({ showLabel = false }: { showLabel?: boolean }) {
  const founder = siteConfig.founder;

  return (
    <>
      {founder.facebookUrl ? (
        <SocialLink href={founder.facebookUrl} label="Facebook" showLabel={showLabel}>
          <FacebookIcon />
        </SocialLink>
      ) : null}
      {founder.instagramUrl ? (
        <SocialLink href={founder.instagramUrl} label="Instagram" showLabel={showLabel}>
          <InstagramIcon />
        </SocialLink>
      ) : null}
      {founder.tiktokUrl ? (
        <SocialLink href={founder.tiktokUrl} label="TikTok" showLabel={showLabel}>
          <TikTokIcon />
        </SocialLink>
      ) : null}
      <SocialLink
        href={getWhatsAppChatUrl()}
        label="WhatsApp"
        showLabel={showLabel}
      >
        <WhatsAppIcon />
      </SocialLink>
      {founder.githubUrl ? (
        <SocialLink href={founder.githubUrl} label="GitHub" showLabel={showLabel}>
          <img src="/logos/github.svg" alt="" className="h-[18px] w-[18px] opacity-80" />
        </SocialLink>
      ) : null}
      {founder.linkedinUrl ? (
        <SocialLink href={founder.linkedinUrl} label="LinkedIn" showLabel={showLabel}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 114.127 0 2.062 2.062 0 01-2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
        </SocialLink>
      ) : null}
    </>
  );
}

export function FounderCard({ variant = "default" }: FounderCardProps) {
  const founder = siteConfig.founder;
  const roleTags = founder.role.split("·").map((tag) => tag.trim()).filter(Boolean);
  const initials = founder.name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (variant === "featured") {
    return (
      <article className="mx-auto w-full max-w-5xl overflow-hidden rounded-3xl border border-border/70 bg-card shadow-[0_22px_60px_-18px_rgba(15,23,42,0.14)]">
        <div className="grid md:grid-cols-[minmax(0,300px)_1fr]">
          <div className="relative flex flex-col items-center justify-center bg-gradient-mesh px-8 py-10 md:py-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,oklch(0.50_0.18_272/0.08),transparent_55%)]" />
            <Avatar className="relative z-10 h-36 w-36 border-[3px] border-card shadow-lg md:h-44 md:w-44">
              {founder.avatarUrl ? (
                <AvatarImage src={founder.avatarUrl} alt={founder.name} className="object-cover" />
              ) : null}
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-indigo-500/20 text-2xl font-bold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <p className="relative z-10 mt-5 text-center text-xs font-semibold uppercase tracking-widest text-primary">
              Prof Zoula
            </p>
          </div>

          <div className="flex flex-col justify-center px-8 py-10 md:px-10 md:py-12">
            <p className="section-label mb-3">Fondateur & administrateur</p>
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {founder.name}
            </h2>

            <div className="mt-4 flex flex-wrap gap-2">
              {roleTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-medium text-foreground/90"
                >
                  {tag}
                </span>
              ))}
            </div>

            <p className="mt-5 text-sm leading-relaxed text-muted-foreground sm:text-base">{founder.bio}</p>

            <div className="mt-7 flex flex-wrap gap-2.5">
              <FounderSocialLinks showLabel />
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="mx-auto w-full max-w-sm rounded-2xl border border-border/70 bg-card px-8 py-10 text-center shadow-[0_8px_30px_rgba(15,23,42,0.08)]">
      <Avatar className="mx-auto h-24 w-24 border-2 border-primary/15 shadow-sm">
        {founder.avatarUrl ? (
          <AvatarImage src={founder.avatarUrl} alt={founder.name} className="object-cover" />
        ) : null}
        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-indigo-500/20 text-xl font-bold text-primary">
          {initials}
        </AvatarFallback>
      </Avatar>

      <h2 className="mt-5 font-display text-xl font-bold text-foreground">{founder.name}</h2>
      <p className="mt-1 text-sm font-medium text-primary">{founder.role}</p>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{founder.bio}</p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <FounderSocialLinks />
      </div>
    </article>
  );
}
