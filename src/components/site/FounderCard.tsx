import type { ReactNode } from "react";
import { Mail } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  formatWhatsAppPhone,
  getWhatsAppChatUrl,
  siteConfig,
} from "@/lib/site-config";
import { cn } from "@/lib/utils";

const twitterHandle = siteConfig.social.twitter.replace(/^@/, "");
const twitterUrl = `https://x.com/${twitterHandle}`;

function SocialLink({
  href,
  label,
  children,
  className,
}: {
  href: string;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target={href.startsWith("mailto:") ? undefined : "_blank"}
      rel={href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
      aria-label={label}
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/10",
        className,
      )}
    >
      {children}
    </a>
  );
}

function SocialXIcon() {
  return (
    <svg width="18" height="17" viewBox="0 0 18 17" fill="none" aria-hidden>
      <path
        d="m5.44.72 3.777 4.994.37.49.405-.463L14.385.72h1.428l-5.296 6.054-.269.306.246.325 6.479 8.565h-4.296l-4.195-5.484-.37-.486-.403.46-4.822 5.51h-1.43l5.716-6.533.27-.308-.25-.325L1.012.72zM2.822 1.867l9.972 13.036.15.197h2.78l-.607-.801-9.86-13.037-.15-.199h-2.9z"
        fill="currentColor"
      />
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

export function FounderCard() {
  const founder = siteConfig.founder;
  const initials = founder.name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

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

      <div className="mt-6 flex items-center justify-center gap-2">
        {founder.githubUrl ? (
          <SocialLink href={founder.githubUrl} label="GitHub">
            <img src="/logos/github.svg" alt="" className="h-5 w-5 opacity-80" />
          </SocialLink>
        ) : null}
        {founder.linkedinUrl ? (
          <SocialLink href={founder.linkedinUrl} label="LinkedIn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 114.127 0 2.062 2.062 0 01-2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          </SocialLink>
        ) : null}
        <SocialLink href={twitterUrl} label="X (Twitter)">
          <SocialXIcon />
        </SocialLink>
        <SocialLink href={getWhatsAppChatUrl()} label={`WhatsApp ${formatWhatsAppPhone()}`}>
          <WhatsAppIcon />
        </SocialLink>
        <SocialLink href={`mailto:${siteConfig.contactEmail}`} label="Email">
          <Mail className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </SocialLink>
      </div>
    </article>
  );
}
