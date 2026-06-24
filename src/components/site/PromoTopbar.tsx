import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { siteConfig } from "@/lib/site-config";

export function PromoTopbar() {
  const enabled = siteConfig.promo.enabled;

  useEffect(() => {
    document.documentElement.classList.toggle("no-promo", !enabled);
    return () => document.documentElement.classList.remove("no-promo");
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className="promo-topbar">
      <div className="site-container flex h-7 sm:h-8 flex-row flex-nowrap items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs leading-none whitespace-nowrap">
        <span className="min-w-0 truncate">
          <span className="sm:hidden">
            <span className="promo-highlight">Ebook gratuit</span>
            <span className="promo-spots"> — 50 premières places</span>
          </span>
          <span className="hidden sm:inline">
            <span className="promo-highlight">Ebook gratuit</span>
            <span className="promo-spots"> offert aux 50 premières inscriptions</span>
            <span> — places limitées !</span>
          </span>
        </span>
        <span className="opacity-60 shrink-0" aria-hidden>
          ·
        </span>
        <Link
          to="/courses"
          className="promo-cta shrink-0 font-semibold hover:underline underline-offset-2"
        >
          Voir les cours →
        </Link>
      </div>
    </div>
  );
}
