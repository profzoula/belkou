import { Link } from "@tanstack/react-router";
import { siteConfig } from "@/lib/site-config";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-6 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="sm:col-span-2 lg:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2.5 font-semibold mb-4">
              <img src={siteConfig.logo} alt={siteConfig.name} className="h-8 w-8 rounded-lg object-contain" />
              {siteConfig.name}
            </Link>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              {siteConfig.tagline}. Apprenez à créer des apps IA, des SaaS et des automatisations avec des outils modernes.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">Navigation</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#features" className="hover:text-foreground transition-colors">Fonctionnalités</a></li>
              <li><a href="#learn" className="hover:text-foreground transition-colors">Parcours</a></li>
              <li><a href="#pricing" className="hover:text-foreground transition-colors">Tarifs</a></li>
              <li><a href="#faq" className="hover:text-foreground transition-colors">FAQ</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">Legal & Contact</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/legal/privacy" className="hover:text-foreground transition-colors">Confidentialité</Link></li>
              <li><Link to="/legal/terms" className="hover:text-foreground transition-colors">Conditions</Link></li>
              <li><Link to="/legal/cgv" className="hover:text-foreground transition-colors">CGV</Link></li>
              <li>{siteConfig.contactEmail}</li>
              <li>{siteConfig.location}</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} {siteConfig.name}. Tous droits réservés.</p>
          <p>Pas de remboursement · Inscriptions définitives</p>
        </div>
      </div>
    </footer>
  );
}
