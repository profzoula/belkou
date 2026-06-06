import { Link } from "@tanstack/react-router";
import { ArrowRight, Play, Star } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { Button } from "@/components/ui/button";
import { ToolsStrip } from "@/components/site/ToolsStrip";

type HeroProps = {
  studentCount: number;
};

const avatars = [
  "bg-orange-200 text-orange-700",
  "bg-orange-100 text-orange-600",
  "bg-amber-100 text-amber-700",
];

export function Hero({ studentCount }: HeroProps) {
  const studentLabel = String(studentCount);

  const stats = [
    { n: studentLabel, l: "Étudiants formés", suffix: "+" },
    { n: "8", l: "Semaines de formation", suffix: "" },
    { n: siteConfig.stats.rating, l: "Note de satisfaction", suffix: "/5" },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-mesh site-page-top pb-12 sm:pb-16 md:pb-24">
      <div className="site-container">
        <div className="max-w-3xl mx-auto text-center animate-fade-up">
          <div className="inline-flex flex-wrap items-center justify-center gap-3 badge mb-6 sm:mb-8">
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
              <span className="font-semibold text-foreground">{studentLabel}+</span>{" "}
              étudiants satisfaits
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-foreground font-semibold">
              <Star className="h-3.5 w-3.5 fill-primary text-primary" />
              4.9
            </span>
          </div>

          <h1 className="font-display text-[2rem] sm:text-[2.75rem] md:text-[3.25rem] lg:text-[3.5rem] font-bold leading-[1.08] mb-5 sm:mb-6 text-balance">
            Créez, lancez et{" "}
            <span className="text-gradient">vendez</span>
            {" "}vos apps IA en 8 semaines
          </h1>

          <p className="max-w-xl mx-auto text-sm sm:text-base text-muted-foreground mb-8 sm:mb-10 leading-relaxed">
            Pas besoin d&apos;être développeur. Apprenez à construire des apps IA, des SaaS et des
            automatisations avec une communauté qui avance avec vous.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12 sm:mb-16">
            <Button asChild variant="hero" size="lg" className="w-full sm:w-auto touch-target px-8">
              <Link to="/register">
                Commencer maintenant <ArrowRight className="h-4 w-4 shrink-0" />
              </Link>
            </Button>
            <Button asChild variant="soft" size="lg" className="w-full sm:w-auto touch-target px-8">
              <a href="#learn">
                <Play className="h-4 w-4 shrink-0" /> Voir le programme
              </a>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-3xl mx-auto mb-12 sm:mb-16 animate-fade-up [animation-delay:100ms]">
          {stats.map((s) => (
            <div key={s.l} className="stat-card">
              <div className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                {s.n}
                <span className="text-primary">{s.suffix}</span>
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">{s.l}</div>
            </div>
          ))}
        </div>

        <div className="max-w-4xl mx-auto animate-fade-up [animation-delay:180ms]">
          <div className="surface rounded-2xl overflow-hidden shadow-lg border border-border">
            <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400/80 shrink-0" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80 shrink-0" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80 shrink-0" />
              <span className="ml-2 text-[11px] font-mono text-muted-foreground">belkou-app.tsx</span>
            </div>
            <div className="overflow-x-auto">
              <div className="p-5 sm:p-6 font-mono text-[11px] sm:text-xs leading-relaxed bg-gray-50 min-w-[17rem]">
                <p><span className="text-primary">const</span> app = <span className="text-orange-600">createSaaS</span>({"{"}</p>
                <p className="pl-4">name: <span className="text-emerald-600">&quot;Mon Projet IA&quot;</span>,</p>
                <p className="pl-4">stack: [<span className="text-emerald-600">&quot;Cursor&quot;</span>, <span className="text-emerald-600">&quot;Replit&quot;</span>],</p>
                <p className="pl-4">deploy: <span className="text-emerald-600">&quot;production&quot;</span></p>
                <p>{"});"}</p>
                <p className="mt-3 text-muted-foreground">// ✓ App déployée en 8 semaines</p>
              </div>
            </div>
          </div>
        </div>

        <ToolsStrip />
      </div>
    </section>
  );
}
