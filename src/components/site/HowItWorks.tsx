import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ChevronRight,
  CreditCard,
  PlayCircle,
  Search,
} from "lucide-react";
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
    description: "Paiement sécurisé. Accès par email, preview immédiate si disponible.",
  },
  {
    icon: PlayCircle,
    title: "Apprenez à votre rythme",
    description: "Vidéos structurées, progression sauvegardée et communauté d'entraide.",
  },
] as const;

/** Full-bleed S-curve matching the reference banner layout. */
function WaveBackground() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block"
      viewBox="0 0 1200 560"
      preserveAspectRatio="none"
    >
      {/* Light panel */}
      <rect width="1200" height="560" className="fill-[var(--card)]" />

      {/* Cream depth layer (slightly offset, like the reference) */}
      <path
        d="M0 0
           H668
           C628 75 568 140 588 225
           C612 325 722 370 678 455
           C648 520 708 548 748 560
           H0
           Z"
        className="fill-[var(--primary-soft)]"
      />

      {/* Primary blue panel with organic S edge */}
      <path
        d="M0 0
           H640
           C598 72 538 138 560 220
           C586 318 692 362 652 448
           C622 518 682 544 720 560
           H0
           Z"
        className="fill-primary"
      />
    </svg>
  );
}

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="site-section-anchor section-divider py-16 sm:py-20 md:py-24"
    >
      <div className="site-container">
        <div className="relative overflow-hidden rounded-[1.75rem] border border-border shadow-[0_28px_80px_rgb(15_23_42_/_0.12)]">
          {/* Mobile / tablet stacked fallback */}
          <div className="lg:hidden">
            <div className="bg-primary px-6 py-10 text-primary-foreground sm:px-10 sm:py-12">
              <p className="text-sm font-semibold text-primary-foreground/70">Comment ça marche</p>
              <span className="mt-3 block h-px w-12 bg-brand-accent" aria-hidden />
              <h2 className="mt-6 font-display text-[1.75rem] font-bold leading-[1.1] tracking-tight sm:text-4xl">
                <span className="text-primary-foreground">Votre parcours.</span>
                <br />
                <span className="text-brand-accent">Notre accompagnement.</span>
              </h2>
              <div className="my-5 flex items-center gap-3" aria-hidden>
                <span className="h-px flex-1 bg-primary-foreground/25" />
                <span className="size-1.5 rounded-full bg-brand-accent" />
                <span className="h-px flex-1 bg-primary-foreground/25" />
              </div>
              <p className="max-w-md text-sm leading-relaxed text-primary-foreground/80 sm:text-base">
                Une variété de cours en Creole, comme Udemy ou Coursera, pensé pour Haïti et la
                diaspora.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to="/courses"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-brand-accent px-8 text-sm font-semibold text-brand-accent-foreground transition hover:bg-brand-accent/90"
                >
                  Voir le catalogue
                </Link>
                <Link
                  to="/courses"
                  aria-label="Voir le catalogue"
                  className="inline-flex size-12 items-center justify-center rounded-full border border-primary-foreground/35 text-primary-foreground transition hover:bg-primary-foreground/10"
                >
                  <ArrowRight className="size-5" />
                </Link>
              </div>
            </div>
            <div className="bg-card px-6 py-6 sm:px-10">
              {steps.map((item, index) => (
                <Link
                  key={item.title}
                  to="/courses"
                  className={cn(
                    "flex items-center gap-4 py-5",
                    index < steps.length - 1 && "border-b border-border",
                  )}
                >
                  <div className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                    <item.icon className="size-5" strokeWidth={1.6} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">{item.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
                </Link>
              ))}
            </div>
          </div>

          {/* Desktop — reference layout */}
          <div className="relative hidden min-h-[34rem] lg:block">
            <WaveBackground />

            <div className="relative z-10 grid h-full min-h-[34rem] grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
              {/* Left copy */}
              <div className="flex flex-col justify-center px-12 py-14 pr-20 xl:px-16 xl:pr-28">
                <p className="text-sm font-semibold text-primary-foreground/70">Comment ça marche</p>
                <span className="mt-3 block h-px w-14 bg-brand-accent" aria-hidden />

                <h2 className="mt-7 max-w-lg font-display text-4xl font-bold leading-[1.08] tracking-tight xl:text-[2.75rem]">
                  <span className="text-primary-foreground">Votre parcours.</span>
                  <br />
                  <span className="text-brand-accent">Notre accompagnement.</span>
                </h2>

                <div className="my-6 flex max-w-md items-center gap-3" aria-hidden>
                  <span className="h-px flex-1 bg-primary-foreground/25" />
                  <span className="size-1.5 rounded-full bg-brand-accent" />
                  <span className="h-px flex-1 bg-primary-foreground/25" />
                </div>

                <p className="max-w-md text-base leading-relaxed text-primary-foreground/80">
                  Une variété de cours en Creole, comme Udemy ou Coursera, pensé pour Haïti et la
                  diaspora.
                </p>

                <div className="mt-9 flex items-center gap-3">
                  <Link
                    to="/courses"
                    className="inline-flex h-12 items-center justify-center rounded-full bg-brand-accent px-9 text-sm font-semibold text-brand-accent-foreground shadow-[0_10px_30px_rgb(255_193_7_/_0.35)] transition hover:bg-brand-accent/90"
                  >
                    Voir le catalogue
                  </Link>
                  <Link
                    to="/courses"
                    aria-label="Voir le catalogue"
                    className="inline-flex size-12 items-center justify-center rounded-full border border-primary-foreground/40 text-primary-foreground transition hover:bg-primary-foreground/10"
                  >
                    <ArrowRight className="size-5" />
                  </Link>
                </div>
              </div>

              {/* Right steps */}
              <div className="relative flex flex-col justify-center py-12 pl-10 pr-12 xl:pl-14 xl:pr-16">
                <div className="relative z-10">
                  {steps.map((item, index) => (
                    <Link
                      key={item.title}
                      to="/courses"
                      className={cn(
                        "group flex items-center gap-4 py-6 transition-colors",
                        index < steps.length - 1 && "border-b border-border/80",
                      )}
                    >
                      <div className="grid size-12 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-md shadow-primary/20">
                        <item.icon className="size-5" strokeWidth={1.6} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-semibold text-foreground group-hover:text-primary">
                          {item.title}
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                      <ChevronRight
                        className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                        aria-hidden
                      />
                    </Link>
                  ))}
                </div>

                {/* Decorative dots + arc like reference */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute right-8 bottom-8 opacity-60"
                >
                  <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
                    <path
                      d="M8 48 C 20 20, 52 12, 64 28"
                      stroke="currentColor"
                      className="text-primary/25"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute right-0 bottom-0 grid grid-cols-3 gap-2">
                    {Array.from({ length: 9 }).map((_, index) => (
                      <span key={index} className="size-1 rounded-full bg-primary/30" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
