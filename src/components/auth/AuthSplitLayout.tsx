import { Link } from "@tanstack/react-router";
import { SiteWordmark } from "@/components/site/SiteWordmark";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

type AuthSplitLayoutProps = {
  children: React.ReactNode;
  /** Kept for callers; register/login switching lives in page copy now. */
  activeTab?: "login" | "signup";
  tabRedirect?: string;
};

const navLinks = [
  { to: "/courses" as const, label: "Cours" },
  { to: "/live" as const, label: "Live" },
  { to: "/services" as const, label: "Services" },
  { to: "/about" as const, label: "À propos" },
];

const footerColumns = [
  {
    title: "Naviguer",
    items: [
      { name: "Cours", href: "/courses" },
      { name: "Live", href: "/live" },
      { name: "Services", href: "/services" },
      { name: "À propos", href: "/about" },
    ],
  },
  {
    title: "Compte",
    items: [
      { name: "Connexion", href: "/login" },
      { name: "Inscription", href: "/signup" },
      { name: "Mes cours", href: "/dashboard" },
      { name: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "Légal",
    items: [
      { name: "Conditions", href: "/legal/terms" },
      { name: "Confidentialité", href: "/legal/privacy" },
      { name: "CGV", href: "/legal/cgv" },
      { name: "Contact", href: `mailto:${siteConfig.contactEmail}` },
    ],
  },
];

/**
 * Dark, centered auth chrome (login / signup / password flows).
 * Scene-style: full-bleed dark canvas, slim top nav, floating form, light footer.
 */
export function AuthSplitLayout({ children }: AuthSplitLayoutProps) {
  return (
    <div className="dark relative flex min-h-[100dvh] flex-col bg-[#050505] text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_-10%,rgb(0_70_213_/_0.22),transparent_55%)]"
      />

      <header className="relative z-10 border-b border-white/5">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:h-[4.25rem] sm:px-6">
          <Link to="/" className="shrink-0" aria-label={`${siteConfig.name} — accueil`}>
            <SiteWordmark size="sm" inverted />
          </Link>

          <nav aria-label="Navigation principale" className="hidden items-center gap-7 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm text-white/55 transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <Link
            to="/courses"
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg border border-white/20 px-3.5 text-sm font-semibold text-white transition-colors hover:border-white/40 hover:bg-white/5 sm:px-4"
          >
            Voir les cours
          </Link>
        </div>
      </header>

      <main
        id="main-content"
        className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-12 sm:py-16"
      >
        <div className="w-full max-w-[420px] animate-in fade-in slide-in-from-bottom-2 duration-500">
          {children}
        </div>
      </main>

      <footer className="relative z-10 mt-auto border-t border-white/5">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,1fr))] md:gap-8 md:py-14">
          <div>
            <SiteWordmark size="sm" inverted />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/45">
              {siteConfig.tagline}
            </p>
            <p className="mt-6 text-xs text-white/35">
              © {new Date().getFullYear()} {siteConfig.brand.title}. Tous droits réservés.
            </p>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title}>
              <p className="text-sm font-semibold text-white/80">{column.title}</p>
              <ul className="mt-4 space-y-2.5">
                {column.items.map((item) => (
                  <li key={item.href + item.name}>
                    <a
                      href={item.href}
                      className="text-sm text-white/40 transition-colors hover:text-white"
                    >
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}

export function AuthFormHeading({
  title,
  subtitle,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("text-center", className)}>
      <h1 className="font-display text-[1.75rem] font-bold tracking-tight text-white text-balance sm:text-[2rem]">
        {title}
      </h1>
      {subtitle ? <p className="mt-2.5 text-sm leading-relaxed text-white/50">{subtitle}</p> : null}
    </div>
  );
}
