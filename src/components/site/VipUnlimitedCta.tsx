import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site-config";

const VIP_PERKS = [
  "Tous les cours, à vie",
  "Tous les lives et replays",
  "Les nouveaux cours inclus",
];

export function VipUnlimitedCta() {
  const price = siteConfig.plans.vip.price;

  return (
    <section className="py-12 sm:py-16">
      <div className="site-container">
        <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-card p-6 shadow-[0_12px_40px_rgb(15_23_42_/_0.06)] sm:p-10 md:p-12">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgb(0_70_213_/_0.12),transparent_55%)]"
          />
          <div className="relative grid items-center gap-8 lg:grid-cols-[minmax(0,1.2fr)_auto]">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/15">
                  <Gift className="size-5" aria-hidden />
                </span>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                  Abonnement VIP
                </p>
              </div>
              <h2 className="mt-4 font-display text-2xl font-bold tracking-tight text-foreground text-balance sm:text-3xl md:text-4xl">
                Accès illimité à tous les cours et lives
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                Un seul paiement. Tous les cours BelKou, tous les directs, et les nouveaux
                programmes — réservé aux membres VIP.
              </p>
              <ul className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-5">
                {VIP_PERKS.map((perk) => (
                  <li key={perk} className="inline-flex items-center gap-2 text-sm text-foreground">
                    <Check className="size-4 shrink-0 text-primary" aria-hidden />
                    {perk}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col items-start gap-3 lg:items-end">
              <p className="font-display text-4xl font-bold tracking-tight text-foreground">
                ${price}
                <span className="ml-1 text-base font-medium text-muted-foreground">USD</span>
              </p>
              <p className="text-xs text-muted-foreground">Paiement unique · accès à vie</p>
              <Button asChild variant="hero" size="lg" className="h-12 rounded-xl px-7">
                <Link to="/checkout" search={{ plan: "vip" }}>
                  Devenir membre VIP
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
