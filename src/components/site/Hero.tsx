import { Link } from "@tanstack/react-router";
import { Rocket, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-24 md:pt-40 md:pb-32">
      <div className="absolute inset-0 -z-10">
        <img
          src={heroBg}
          alt=""
          width={1920}
          height={1280}
          className="h-full w-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/30 to-background" />
      </div>

      <div className="container mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium text-muted-foreground mb-8 animate-float">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse-glow" />
          Prochainement — Lancez bientôt
        </div>

        <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.05] mb-6">
          Apprenez <span className="text-gradient">VibeCoding</span>
          <br />
          Créez des Apps IA Rapidement
        </h1>

        <p className="mx-auto max-w-2xl text-lg md:text-xl text-muted-foreground mb-10">
          Apprenez à utiliser les outils IA pour créer des sites web, des SaaS, des automations,
          et des applications sans difficulté. Du zéro au lancement de votre propre projet.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild variant="hero" size="xl">
            <Link to="/register">
              <Rocket /> S'inscrire Maintenant
            </Link>
          </Button>
          <Button asChild variant="neon" size="xl">
            <a href="#learn"><Play /> Ce que vous apprendrez</a>
          </Button>
        </div>

        <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
          {[
            { n: "500+", l: "Étudiants" },
            { n: "20+", l: "Outils IA" },
            { n: "4.9★", l: "Note" },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <div className="text-3xl md:text-4xl font-display font-bold text-gradient-orange">{s.n}</div>
              <div className="text-xs md:text-sm text-muted-foreground mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
