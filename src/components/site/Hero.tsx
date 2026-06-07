import { Link } from "@tanstack/react-router";
import { ArrowRight, Play, Star } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { Button } from "@/components/ui/button";
import { ToolsStrip } from "@/components/site/ToolsStrip";
import { FormationObjectivesPanel } from "@/components/site/FormationObjectives";

type HeroProps = {
  studentCount: number;
};

const avatars = [
  "bg-orange-200 dark:bg-orange-500/25 text-orange-700 dark:text-orange-300",
  "bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-300",
  "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300",
];

function CodePreview() {
  return (
    <div className="surface min-w-0 rounded-2xl overflow-hidden shadow-md border border-border h-full">
      <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-2.5">
        <span className="h-2 w-2 rounded-full bg-red-400/80 shrink-0" />
        <span className="h-2 w-2 rounded-full bg-amber-400/80 shrink-0" />
        <span className="h-2 w-2 rounded-full bg-emerald-400/80 shrink-0" />
        <span className="ml-1.5 text-[10px] font-mono text-muted-foreground">belkou-app.tsx</span>
      </div>
      <div className="p-4 sm:p-5 font-mono text-[11px] sm:text-xs leading-relaxed bg-muted/30 dark:bg-muted/50 text-foreground break-words">
        <p>
          <span className="text-primary">const</span> app ={" "}
          <span className="text-orange-600 dark:text-orange-400">createSaaS</span>({"{"}
        </p>
        <p className="pl-4">
          name: <span className="text-emerald-600 dark:text-emerald-400">&quot;Mon Projet IA&quot;</span>,
        </p>
        <p className="pl-4">
          stack: [<span className="text-emerald-600 dark:text-emerald-400">&quot;Cursor&quot;</span>,{" "}
          <span className="text-emerald-600 dark:text-emerald-400">&quot;Replit&quot;</span>],
        </p>
        <p className="pl-4">
          deploy: <span className="text-emerald-600 dark:text-emerald-400">&quot;production&quot;</span>
        </p>
        <p>{"});"}</p>
        <p className="mt-2.5 text-muted-foreground">// ✓ App déployée en 8 semaines</p>
      </div>
    </div>
  );
}

export function Hero({ studentCount }: HeroProps) {
  const studentLabel = String(studentCount);

  const stats = [
    { n: studentLabel, l: "Étudiants formés", suffix: "+" },
    { n: "8", l: "Semaines de formation", suffix: "" },
    { n: siteConfig.stats.rating, l: "Note de satisfaction", suffix: "/5" },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-mesh site-page-top pb-12 sm:pb-16 md:pb-20">
      <div
        aria-hidden
        className="pointer-events-none absolute top-20 left-1/4 h-72 w-72 rounded-full bg-primary/8 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-32 right-0 h-96 w-96 rounded-full bg-amber-300/10 blur-3xl"
      />

      <div className="site-container relative pt-8 sm:pt-10 lg:pt-12 min-w-0">
        <div className="grid min-w-0 lg:grid-cols-2 lg:grid-rows-[auto_auto_auto] gap-x-10 xl:gap-x-14 gap-y-8 lg:gap-y-6 items-start">
          {/* Hero copy */}
          <div className="order-1 lg:col-start-1 lg:row-start-1 min-w-0 w-full max-w-full text-center lg:text-left animate-fade-up">
            <div className="inline-flex flex-wrap items-center justify-center lg:justify-start gap-3 badge mb-5 sm:mb-6">
              <div className="avatar-stack">
                {avatars.map((cls, i) => (
                  <div
                    key={i}
                    className={`grid h-7 w-7 place-items-center text-[10px] font-bold ${cls}`}
                  >
                    {["J", "M", "W"][i]}
                  </div>
                ))}
              </div>
              <span>
                <span className="font-semibold text-foreground">{studentLabel}+</span> étudiants satisfaits
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-foreground font-semibold">
                <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                4.9
              </span>
            </div>

            <h1 className="font-display text-[1.65rem] sm:text-[2.75rem] md:text-[3rem] lg:text-[3.1rem] font-bold leading-[1.12] mb-4 sm:mb-5 text-balance break-words">
              Créez, lancez et <span className="text-gradient">vendez</span> vos apps IA en 8 semaines
            </h1>

            <p className="max-w-xl mx-auto lg:mx-0 text-sm sm:text-base text-muted-foreground mb-6 sm:mb-7 leading-relaxed break-words">
              Pas besoin d&apos;être développeur. Apprenez à construire des apps IA, des SaaS et des automatisations
              avec une communauté qui avance avec vous.
            </p>

            <div className="flex w-full max-w-full flex-col sm:flex-row items-stretch sm:items-center lg:items-start justify-center lg:justify-start gap-3 mb-4">
              <Button
                asChild
                variant="hero"
                size="lg"
                className="w-full max-w-full sm:w-auto touch-target px-4 sm:px-8 whitespace-normal text-center"
              >
                <Link to="/register">
                  S&apos;inscrire à la formation <ArrowRight className="h-4 w-4 shrink-0" />
                </Link>
              </Button>
              <Button
                asChild
                variant="soft"
                size="lg"
                className="w-full max-w-full sm:w-auto touch-target px-4 sm:px-8 whitespace-normal text-center"
              >
                <a href="#learn">
                  <Play className="h-4 w-4 shrink-0" /> Voir le programme
                </a>
              </Button>
            </div>

            <p className="text-sm text-muted-foreground break-words">
              Pas encore prêt ?{" "}
              <Link to="/signup" className="font-semibold text-primary hover:underline">
                Créer un compte
              </Link>
              {" "}ou{" "}
              <Link to="/login" className="font-semibold text-primary hover:underline">
                Connexion
              </Link>
            </p>
          </div>

          {/* Objectifs — dwat, sticky */}
          <div className="order-2 lg:col-start-2 lg:row-start-1 lg:row-span-3 min-w-0 w-full max-w-full animate-fade-up [animation-delay:60ms] lg:sticky lg:top-[calc(var(--site-header-height)+1rem)]">
            <FormationObjectivesPanel />
          </div>

          {/* Stats */}
          <div className="order-3 lg:col-start-1 lg:row-start-2 min-w-0 w-full grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 animate-fade-up [animation-delay:100ms]">
            {stats.map((s, i) => (
              <div
                key={s.l}
                className={`stat-card text-left! py-3 sm:py-4 px-3 sm:px-4 ${i === 2 ? "col-span-2 sm:col-span-1" : ""}`}
              >
                <div className="font-display text-xl sm:text-2xl font-bold text-foreground">
                  {s.n}
                  <span className="text-primary">{s.suffix}</span>
                </div>
                <div className="text-[11px] sm:text-xs text-muted-foreground mt-1 leading-snug">{s.l}</div>
              </div>
            ))}
          </div>

          {/* Code + logos scroll */}
          <div className="order-4 lg:col-start-1 lg:row-start-3 min-w-0 w-full max-w-full space-y-3 sm:space-y-4 animate-fade-up [animation-delay:140ms]">
            <CodePreview />
            <ToolsStrip variant="marquee" logosOnly showLabel={false} align="left" bordered={false} />
          </div>
        </div>
      </div>
    </section>
  );
}
