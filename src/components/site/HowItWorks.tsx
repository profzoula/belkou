import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ChevronRight,
  CreditCard,
  Handshake,
  PlayCircle,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const steps = [
  {
    icon: Search,
    title: "Explorez le catalogue",
    description: "Parcourez les cours et regardez la preview gratuite de chaque formation.",
  },
  {
    icon: CreditCard,
    title: "Inscrivez-vous au cours",
    description: "Paiement sécurisé — accès par email, preview immédiate si disponible.",
  },
  {
    icon: PlayCircle,
    title: "Apprenez à votre rythme",
    description: "Vidéos structurées, progression sauvegardée et communauté d'entraide.",
  },
] as const;

function SplitCurve({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 72 480"
      preserveAspectRatio="none"
      className={cn("pointer-events-none absolute top-0 hidden h-full w-[4.5rem] lg:block", className)}
    >
      <path
        d="M72 0 C28 96 28 384 72 480 L72 0 Z"
        className="fill-[#f7f4ef] dark:fill-card"
      />
    </svg>
  );
}

function HexagonBadge() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/2 z-20 hidden -translate-x-1/2 -translate-y-1/2 lg:flex"
    >
      <div className="grid size-[5.5rem] place-items-center bg-foreground [clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)]">
        <div className="grid size-[4.35rem] place-items-center bg-brand-accent [clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)]">
          <Handshake className="size-7 text-brand-accent-foreground" strokeWidth={1.75} />
        </div>
      </div>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="site-section-anchor section-divider py-16 sm:py-20 md:py-24"
    >
      <div className="site-container">
        <div className="relative overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-[0_24px_70px_rgb(15_23_42_/_0.08)]">
          <div className="grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <div className="relative z-10 bg-foreground px-6 py-10 text-background sm:px-10 sm:py-12 lg:px-12 lg:py-14 xl:px-14">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-background/55">
                Comment ça marche
              </p>
              <span className="mt-3 block h-0.5 w-10 rounded-full bg-brand-accent" aria-hidden />
              <h2 className="mt-6 max-w-md font-display text-[1.75rem] font-bold leading-[1.12] tracking-tight sm:text-4xl">
                <span className="text-background">Votre parcours.</span>
                <br />
                <span className="text-brand-accent">Notre accompagnement.</span>
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-background/72 sm:text-base">
                Comme Udemy ou Coursera — mais en français, pensé pour la diaspora haïtienne.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button
                  asChild
                  size="lg"
                  className="h-12 rounded-full border-0 bg-brand-accent px-7 text-sm font-semibold text-brand-accent-foreground hover:bg-brand-accent/90"
                >
                  <Link to="/courses">Voir le catalogue</Link>
                </Button>
                <Button
                  asChild
                  size="icon"
                  className="size-12 rounded-full border border-background/25 bg-transparent text-background hover:bg-background/10"
                  aria-label="Voir le catalogue"
                >
                  <Link to="/courses">
                    <ArrowRight className="size-5" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="relative bg-[#f7f4ef] px-6 py-8 dark:bg-card sm:px-10 lg:px-10 lg:py-10 xl:pr-12">
              <SplitCurve className="-left-[4.45rem]" />

              <div className="relative lg:pl-6 xl:pl-10">
                {steps.map((item, index) => (
                  <div
                    key={item.title}
                    className={cn(
                      "flex items-center gap-4 py-5",
                      index < steps.length - 1 && "border-b border-border/50",
                    )}
                  >
                    <div className="grid size-11 shrink-0 place-items-center rounded-full bg-foreground text-background shadow-sm">
                      <item.icon className="size-5" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground">{item.title}</p>
                      <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    <ChevronRight
                      className="size-5 shrink-0 text-muted-foreground/70"
                      aria-hidden
                    />
                  </div>
                ))}
              </div>

              <div
                aria-hidden
                className="pointer-events-none absolute bottom-4 right-4 hidden opacity-40 lg:block"
              >
                <div className="size-16 rounded-full border border-border/60" />
                <div className="absolute -right-1 bottom-0 grid grid-cols-3 gap-1">
                  {Array.from({ length: 9 }).map((_, index) => (
                    <span key={index} className="size-1 rounded-full bg-border" />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <HexagonBadge />
        </div>
      </div>
    </section>
  );
}
