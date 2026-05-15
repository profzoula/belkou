import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

const links = {
  Formation: [
    { label: "Programme", href: "#learn" },
    { label: "Fonctionnalités", href: "#features" },
    { label: "Tarifs", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ],
  Légal: [
    { label: "Confidentialité", href: "#" },
    { label: "Conditions d'utilisation", href: "#" },
    { label: "Mentions légales", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border/50 pt-16 pb-10 mt-12">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2.5 font-display text-base font-bold mb-4">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-primary shadow-glow">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </span>
              BelKou Formation
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Apprenez à créer des Apps IA et des SaaS en 4 semaines.
              Formation 100% en français avec mentorat réel.
            </p>
          </div>

          {/* Nav columns */}
          {Object.entries(links).map(([section, items]) => (
            <div key={section}>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">{section}</h4>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border/40 pt-8 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} BelKou Formation. Tous droits réservés.</p>
          <div className="flex items-center gap-4">
            <p>Fait avec ❤️ pour les créateurs francophones</p>
            <Link to="/admin/login" className="opacity-30 hover:opacity-70 transition-opacity text-[10px] tracking-widest uppercase">
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
