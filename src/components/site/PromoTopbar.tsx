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
      <div className="site-container flex min-h-7 sm:min-h-8 h-auto py-1 sm:py-0 sm:h-8 flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 text-[10px] sm:text-xs leading-tight sm:leading-none">
        <p className="truncate">
          <span className="sm:hidden">
            <span className="promo-highlight">Ebook gratuit</span>
            <span className="promo-spots"> — 50 premières places</span>
          </span>
          <span className="hidden sm:inline">
            <span className="promo-highlight">Ebook gratuit</span>
            <span className="promo-spots"> offert aux 50 premières inscriptions</span>
            <span> — places limitées !</span>
          </span>
        </p>
        <span className="opacity-60 shrink-0" aria-hidden>
          ·
        </span>
        <Link
          to="/register"
          className="promo-cta shrink-0 font-semibold whitespace-nowrap hover:underline underline-offset-2"
        >
          S&apos;inscrire →
        </Link>
      </div>
    </div>
  );
}
