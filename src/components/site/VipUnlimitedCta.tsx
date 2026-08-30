import { Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const VIP_PERKS = [
  "Tous les cours, à vie",
  "Tous les lives et replays",
  "Les nouveaux cours inclus",
];

type VipUnlimitedCtaProps = {
  /** Renders only the card, without the page section and container wrappers. */
  embedded?: boolean;
  className?: string;
};

export function VipUnlimitedCta({ embedded = false, className }: VipUnlimitedCtaProps) {
  const card = (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-primary/20 bg-card p-6 shadow-[0_12px_40px_rgb(15_23_42_/_0.06)]",
        embedded ? "sm:p-8" : "sm:p-10 md:p-12",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgb(0_70_213_/_0.12),transparent_55%)]"
      />
      <div className="relative grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-12">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-primary">Abonnement VIP</p>
          <h2
            className={cn(
              "mt-3 font-display text-2xl font-bold tracking-tight text-foreground text-balance",
              embedded ? "sm:text-[1.75rem]" : "sm:text-3xl md:text-4xl",
            )}
          >
            Accès illimité à tous les cours et lives
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Un seul paiement. Tous les cours BelKou, tous les directs, et les nouveaux programmes.
            Réservé aux membres VIP.
          </p>
          <ul className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-5">
            {VIP_PERKS.map((perk) => (
              <li key={perk} className="inline-flex items-center gap-2 text-sm text-foreground">
                <Check className="size-4 shrink-0 text-primary" aria-hidden />
                {perk}
              </li>
            ))}
          </ul>
          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Button asChild variant="hero" size="lg" className="h-12 rounded-xl px-7">
              <Link to="/checkout" search={{ plan: "vip" }}>
                Devenir membre VIP
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
            <p className="text-xs text-muted-foreground">Paiement unique · accès à vie</p>
          </div>
        </div>
        <div className="mx-auto w-full max-w-[13rem] max-lg:-order-1 sm:max-w-[15rem] lg:max-w-none">
          <div className="overflow-hidden rounded-[1.75rem] bg-black shadow-[0_16px_40px_rgb(15_23_42_/_0.18)] ring-1 ring-black/10">
            <img
              src="/hero/student-original.png"
              alt="Diplômée BelKou avec son laptop — accès VIP"
              className="block aspect-[4/5] h-auto w-full object-cover object-[center_18%]"
              width={768}
              height={960}
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </div>
    </div>
  );

  if (embedded) return card;

  return (
    <section className="py-12 sm:py-16">
      <div className="site-container">{card}</div>
    </section>
  );
}
