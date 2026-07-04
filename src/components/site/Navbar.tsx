import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/forum/NotificationBell";
import { UserAccountMenu } from "@/components/auth/UserAccountMenu";
import { SiteLogo } from "@/components/site/SiteLogo";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { PromoTopbar } from "@/components/site/PromoTopbar";

const links = [
  { href: "/courses", label: "Cours", route: true },
  { href: "/services", label: "Services", route: true },
  { href: "#how-it-works", label: "Comment ça marche", route: false },
  { href: "/faq", label: "FAQ", route: true },
];

function NavActions({
  onNavigate,
  stacked,
  dark,
  hero,
}: {
  onNavigate?: () => void;
  stacked?: boolean;
  dark?: boolean;
  hero?: boolean;
}) {
  const { user, loading, signOut } = useAuth();
  const wrapClass = stacked
    ? "flex flex-col gap-2 w-full [&_button]:w-full [&_a]:w-full [&_button]:touch-target [&_a]:touch-target"
    : "flex items-center gap-2";

  if (loading) {
    return <div className="h-9 w-24 rounded-full bg-muted/60 animate-pulse" />;
  }

  if (user) {
    if (stacked) {
      return (
        <div className="flex flex-col gap-1 w-full">
          <Link
            to="/dashboard"
            onClick={onNavigate}
            className="touch-target rounded-lg px-3 py-3 text-sm font-semibold hover:bg-accent"
          >
            Mes cours
          </Link>
          <Link
            to="/courses"
            onClick={onNavigate}
            className="touch-target rounded-lg px-3 py-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            Catalogue de cours
          </Link>
          <Link
            to="/forum"
            onClick={onNavigate}
            className="touch-target rounded-lg px-3 py-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            Forum
          </Link>
          <Link
            to="/dashboard"
            hash="affiliate"
            onClick={onNavigate}
            className="touch-target rounded-lg px-3 py-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            Programme affilié
          </Link>
          <button
            type="button"
            className="touch-target rounded-lg px-3 py-3 text-left text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
            onClick={async () => {
              onNavigate?.();
              await signOut();
              window.location.href = "/";
            }}
          >
            Déconnexion
          </button>
        </div>
      );
    }

    return (
      <div className={wrapClass}>
        <Link
          to="/forum"
          onClick={onNavigate}
          className="hidden sm:inline-flex rounded-full px-3.5 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
        >
          Forum
        </Link>
        <Link
          to="/dashboard"
          onClick={onNavigate}
          className="hidden sm:inline-flex rounded-full px-3.5 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
        >
          Mes cours
        </Link>
        <NotificationBell />
        <UserAccountMenu onNavigate={onNavigate} />
      </div>
    );
  }

  return (
    <div className={wrapClass}>
      {hero ? (
        <>
          <Button
            asChild
            size={stacked ? "lg" : "sm"}
            className="rounded-full bg-indigo-600 px-6 text-white hover:bg-indigo-700"
          >
            <Link to="/courses" onClick={onNavigate}>
              Commencer
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size={stacked ? "lg" : "sm"}
            className="rounded-full border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <Link to="/login" onClick={onNavigate}>
              Connexion
            </Link>
          </Button>
        </>
      ) : (
        <>
          <Button
            asChild
            variant={dark ? "inverse" : "ghost"}
            size={stacked ? "lg" : "sm"}
            className={
              dark && !stacked ? "bg-white text-black hover:bg-white/90" : dark ? undefined : "text-muted-foreground"
            }
          >
            <Link to="/login" onClick={onNavigate}>
              Connexion
            </Link>
          </Button>
          <Button
            asChild
            variant={dark ? "outline" : "hero"}
            size={stacked ? "lg" : "sm"}
            className={dark ? "border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white" : undefined}
          >
            <Link to="/signup" onClick={onNavigate}>
              S&apos;inscrire
            </Link>
          </Button>
        </>
      )}
    </div>
  );
}

export function Navbar({ theme = "default" }: { theme?: "default" | "dark" | "hero" }) {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const isDark = theme === "dark";
  const isHero = theme === "hero";

  const linkClass = isDark
    ? "rounded-full px-3.5 py-2 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
    : isHero
      ? "rounded-full px-3.5 py-2 text-sm text-slate-700 transition-colors hover:text-indigo-600"
      : "rounded-full px-3.5 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground hover:bg-accent";

  const mobileLinkClass = isDark
    ? "touch-target rounded-lg px-3 py-3 text-sm text-white/70 hover:bg-white/10 hover:text-white"
    : isHero
      ? "touch-target rounded-lg px-3 py-3 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
      : "touch-target rounded-lg px-3 py-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground";

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 pt-[env(safe-area-inset-top,0px)]">
      <PromoTopbar />
      <div
        className={
          isDark
            ? "border-b border-white/10 bg-[#07080d]/80 backdrop-blur-md"
            : isHero
              ? "border-b border-border/60 bg-white/70 backdrop-blur-md"
              : "glass"
        }
      >
        <div className="site-container flex h-14 sm:h-16 items-center justify-between gap-3">
          <Link
            to="/"
            className={cn(
              "flex min-w-0 items-center gap-2.5 font-display font-bold tracking-tight",
              isDark && "text-white",
            )}
          >
            <SiteLogo className="h-8 w-8" alt={siteConfig.name} />
            <span className="truncate text-[15px]">{siteConfig.name}</span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {links.map((l) =>
              l.route ? (
                <Link key={l.href} to={l.href} className={linkClass}>
                  {l.label}
                </Link>
              ) : (
                <a key={l.href} href={l.href} className={linkClass}>
                  {l.label}
                </a>
              ),
            )}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <NavActions dark={isDark} hero={isHero} />
          </div>

          <div className="flex items-center gap-2 md:hidden">
            {!loading && user ? <UserAccountMenu onNavigate={close} /> : null}
            <button
              type="button"
              className={cn(
                "grid h-10 w-10 touch-target place-items-center rounded-full border",
                isDark
                  ? "border-white/15 bg-white/5 text-white"
                  : "border-border bg-card text-foreground",
              )}
              onClick={() => setOpen(!open)}
              aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          aria-label="Fermer le menu"
          onClick={close}
        />
      )}

      {open && (
        <div
          className={cn(
            "relative z-50 md:hidden border-t site-container py-4 shadow-md max-h-[calc(100dvh-var(--site-header-height))] overflow-y-auto overscroll-contain",
            isDark ? "border-white/10 bg-[#07080d]" : "border-border bg-card",
          )}
        >
          <nav className="flex flex-col gap-1">
            {links.map((l) =>
              l.route ? (
                <Link key={l.href} to={l.href} onClick={close} className={mobileLinkClass}>
                  {l.label}
                </Link>
              ) : (
                <a key={l.href} href={l.href} onClick={close} className={mobileLinkClass}>
                  {l.label}
                </a>
              ),
            )}
            <div className={cn("mt-3 pt-3 border-t", isDark ? "border-white/10" : "border-border")}>
              <NavActions onNavigate={close} stacked dark={isDark} hero={isHero} />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
