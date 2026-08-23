import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site-config";

export function CTA() {
  return (
    <section className="py-16 sm:py-20 md:py-28">
      <div className="site-container">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-brand p-8 sm:p-12 md:p-16 text-center shadow-primary">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,oklch(1_0_0/0.15),transparent_50%)]" />
          <div className="relative max-w-lg mx-auto">
            <p className="text-sm font-semibold text-primary-foreground/80">
              VIP · ${siteConfig.plans.vip.price} USD
            </p>
            <h2 className="mt-3 font-display text-2xl sm:text-3xl md:text-4xl font-bold text-primary-foreground mb-4 text-balance">
              Accès illimité à tout BelKou
            </h2>
            <p className="text-sm sm:text-base text-primary-foreground/85 mb-8 leading-relaxed">
              Tous les cours, tous les lives, à vie. Un seul abonnement, réservé aux membres VIP.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto touch-target bg-card text-foreground hover:bg-card/95 shadow-md px-8"
              >
                <Link to="/checkout" search={{ plan: "vip" }}>
                  Devenir membre VIP <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full sm:w-auto touch-target border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 px-8"
              >
                <Link to="/courses">Voir les cours à l&apos;unité</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
