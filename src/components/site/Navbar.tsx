import { Link } from "@tanstack/react-router";
import { Sparkles, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

const navLinks = [
  { href: "#features", label: "Formation" },
  { href: "#learn",    label: "Programme" },
  { href: "#pricing",  label: "Tarifs" },
  { href: "#faq",      label: "FAQ" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen]         = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "glass shadow-card" : "bg-transparent"}`}>
      <div className="container mx-auto flex h-16 items-center justify-between px-6">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-display text-[1.05rem] font-bold tracking-tight">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-primary shadow-glow">
            <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
          </span>
          BelKou
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} className="rounded-lg px-3.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground">
              {l.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors px-2">
            Se connecter
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90 transition-opacity"
          >
            S'inscrire →
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="grid md:hidden h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="glass border-t border-border md:hidden">
          <nav className="container mx-auto flex flex-col gap-1 px-6 py-4">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors">
                {l.label}
              </a>
            ))}
            <div className="mt-3 pt-3 border-t border-border">
              <Link
                to="/register"
                onClick={() => setOpen(false)}
                className="flex w-full items-center justify-center rounded-xl bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90 transition-opacity"
              >
                S'inscrire Maintenant
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
