import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site-config";
import { useAuth } from "@/hooks/use-auth";

const links = [
  { href: "#features", label: "Fonctionnalités" },
  { href: "#learn", label: "Parcours" },
  { href: "#pricing", label: "Tarifs" },
  { href: "#faq", label: "FAQ" },
];

function NavActions({ onNavigate }: { onNavigate?: () => void }) {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return <div className="h-9 w-24 rounded-lg bg-muted/60 animate-pulse" />;
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="sm">
          <Link to="/dashboard" onClick={onNavigate}>
            Mon espace
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={async () => {
            await signOut();
            onNavigate?.();
            window.location.href = "/";
          }}
        >
          Déconnexion
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="outline" size="sm">
        <Link to="/login" onClick={onNavigate}>
          Connexion
        </Link>
      </Button>
      <Button asChild variant="hero" size="sm">
        <Link to="/register" onClick={onNavigate}>
          S&apos;inscrire
        </Link>
      </Button>
    </div>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container mx-auto flex h-[4.25rem] items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
          <img src={siteConfig.logo} alt={siteConfig.name} className="h-8 w-8 rounded-lg object-contain" />
          <span className="text-[15px]">{siteConfig.name}</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-md px-3.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:block">
          <NavActions />
        </div>

        <button
          type="button"
          className="md:hidden grid h-9 w-9 place-items-center rounded-lg border border-border bg-card text-foreground"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-card px-6 py-4 shadow-md">
          <nav className="flex flex-col gap-1">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={close}
                className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
            <div className="mt-3 flex flex-col gap-2">
              <NavActions onNavigate={close} />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
