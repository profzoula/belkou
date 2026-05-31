import { Link } from "@tanstack/react-router";
import { ArrowRight, Play, Star } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { Button } from "@/components/ui/button";
import { ToolsStrip } from "@/components/site/ToolsStrip";

type HeroProps = {
  studentCount: number;
};

export function Hero({ studentCount }: HeroProps) {
  const studentLabel = String(studentCount);

  const stats = [
    { n: studentLabel, l: "Étudiants", highlight: true },
    { n: siteConfig.stats.tools, l: "Outils IA" },
    { n: siteConfig.stats.rating, l: "Satisfaction" },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-mesh pt-[5.5rem] pb-16 md:pb-20">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="animate-fade-up">
            <div className="badge mb-6">
              <span className="badge-dot" />
              Cohorte 2026 — Places limitées
            </div>

            <h1 className="text-[2rem] md:text-[2.625rem] font-semibold leading-[1.15] mb-5">
              Apprenez à créer des{" "}
              <span className="text-gradient">apps IA & SaaS</span>
              {" "}en 4 semaines
            </h1>

            <p className="max-w-lg text-[15px] text-muted-foreground mb-8 leading-relaxed">
              Vous n&apos;avez pas besoin d&apos;être développeur. Apprenez à créer, lancer et
              vendre votre premier produit digital avec l&apos;IA et une communauté qui avance
              avec vous.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <Button asChild variant="hero" size="lg">
                <Link to="/register">
                  Commencer maintenant <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="neon" size="lg">
                <a href="#learn">
                  <Play className="h-4 w-4" /> Voir le programme
                </a>
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-primary text-primary" />
                4.9/5 ·{" "}
                <span className="text-primary font-semibold">{studentLabel}</span> étudiants
              </span>
            </div>
          </div>

          <div className="relative animate-fade-up [animation-delay:120ms]">
            <div className="surface rounded-2xl overflow-hidden shadow-lg">
              <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                <span className="ml-2 text-xs font-mono text-muted-foreground">belkou-app.tsx</span>
              </div>
              <div className="p-5 font-mono text-[11px] leading-relaxed bg-[oklch(0.985_0.006_264)]">
                <p><span className="text-primary">const</span> app = <span className="text-[oklch(0.45_0.15_290)]">createSaaS</span>({"{"}</p>
                <p className="pl-4">name: <span className="text-emerald-600">"Mon Projet IA"</span>,</p>
                <p className="pl-4">stack: [<span className="text-emerald-600">"Cursor"</span>, <span className="text-emerald-600">"Replit"</span>],</p>
                <p className="pl-4">deploy: <span className="text-emerald-600">"production"</span></p>
                <p>{"});"}</p>
                <p className="mt-3 text-muted-foreground">// ✓ App lancée en 4 semaines</p>
              </div>
            </div>

            <div className="absolute -bottom-4 -left-4 surface rounded-xl px-4 py-3 shadow-md hidden sm:block">
              <div className="grid grid-cols-3 gap-4">
                {stats.map((s) => (
                  <div key={s.l} className="text-center min-w-[4.5rem]">
                    <div
                      className={
                        s.highlight
                          ? "text-base font-semibold text-primary"
                          : "text-base font-semibold"
                      }
                    >
                      {s.n}
                    </div>
                    <div className="text-[10px] text-muted-foreground">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <ToolsStrip />
      </div>
    </section>
  );
}
