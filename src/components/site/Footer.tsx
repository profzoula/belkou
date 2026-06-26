import { Link } from "@tanstack/react-router";
import { siteConfig } from "@/lib/site-config";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card pb-[env(safe-area-inset-bottom,0px)]">
      <div className="site-container py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10">
          <div className="min-w-0">
            <Link to="/" className="inline-flex items-center gap-2.5 font-display font-bold mb-4">
              <img src={siteConfig.logo} alt={siteConfig.name} className="h-8 w-8 rounded-lg object-contain" />
              {siteConfig.name}
            </Link>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              {siteConfig.tagline}. Formations vidéo en français pour créer des apps IA, des SaaS et monétiser en ligne.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 sm:gap-10 min-w-0">
            <div className="min-w-0">
              <h4 className="text-sm font-semibold mb-4">Navigation</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li>
                  <Link to="/courses" className="hover:text-foreground transition-colors">
                    Tous les cours
                  </Link>
                </li>
                <li>
                  <Link to="/services" className="hover:text-foreground transition-colors">
                    Services
                  </Link>
                </li>
                <li>
                  <a href="#how-it-works" className="hover:text-foreground transition-colors">
                    Comment ça marche
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-foreground transition-colors">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>

            <div className="min-w-0">
              <h4 className="text-sm font-semibold mb-4">Juridique & Contact</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li>
                  <Link to="/legal/privacy" className="hover:text-foreground transition-colors">
                    Confidentialité
                  </Link>
                </li>
                <li>
                  <Link to="/legal/terms" className="hover:text-foreground transition-colors">
                    Conditions
                  </Link>
                </li>
                <li>
                  <Link to="/legal/cgv" className="hover:text-foreground transition-colors">
                    CGV
                  </Link>
                </li>
                <li className="break-all">{siteConfig.contactEmail}</li>
                <li>{siteConfig.location}</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}. Tous droits réservés.
          </p>
          <p>Pas de remboursement · Inscriptions définitives</p>
        </div>
      </div>
    </footer>
  );
}
