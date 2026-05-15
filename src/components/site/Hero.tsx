import { Link } from "@tanstack/react-router";
import { Rocket, ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";

const stats = [
  { value: "500+", label: "Étudiants formés" },
  { value: "20+", label: "Outils IA couverts" },
  { value: "4.9/5", label: "Note moyenne" },
];

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* Background image */}
      <div className="absolute inset-0 -z-20">
        <img src={heroBg} alt="" className="h-full w-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/50 to-background" />
      </div>

      {/* Ambient orbs */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-primary/8 blur-[120px] animate-orb" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-secondary/8 blur-[120px] animate-orb" style={{ animationDelay: "4s" }} />

      <div className="container mx-auto px-6 py-24 md:py-32">
        <div className="mx-auto max-w-4xl text-center">

          {/* Badge */}
          <div className="mb-8 inline-flex animate-fade-up" style={{ animationDelay: "0.1s" }}>
            <span className="chip">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Cohorte ouverte — Places limitées
            </span>
          </div>

          {/* Headline */}
          <h1
            className="animate-fade-up font-display text-5xl font-bold leading-[1.08] tracking-tight md:text-7xl lg:text-[5.5rem] mb-6"
            style={{ animationDelay: "0.2s" }}
          >
            Lancez votre{" "}
            <span className="text-gradient">App IA</span>
            <br />
            en 4 semaines
          </h1>

          {/* Sub */}
          <p
            className="animate-fade-up mx-auto max-w-2xl text-lg text-muted-foreground leading-relaxed mb-10 md:text-xl"
            style={{ animationDelay: "0.3s" }}
          >
            BelKou vous apprend à utiliser les outils IA pour créer des sites web, des SaaS
            et des automations — de zéro jusqu'au lancement de votre premier projet.
          </p>

          {/* CTAs */}
          <div
            className="animate-fade-up flex flex-col sm:flex-row items-center justify-center gap-3 mb-16"
            style={{ animationDelay: "0.4s" }}
          >
            <Button
              asChild
              size="lg"
              className="bg-gradient-primary text-primary-foreground shadow-glow font-semibold rounded-xl px-8 h-12 text-base hover:opacity-90 transition-opacity gap-2"
            >
              <Link to="/register">
                <Rocket className="h-4 w-4" /> S'inscrire Maintenant
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="lg"
              className="h-12 px-8 text-base rounded-xl border border-border hover:border-primary/40 hover:bg-white/5 transition-all gap-2"
            >
              <a href="#learn">
                Voir le programme <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </div>

          {/* Social proof row */}
          <div className="animate-fade-up flex items-center justify-center gap-3 mb-12" style={{ animationDelay: "0.45s" }}>
            <div className="flex -space-x-2">
              {["J", "S", "K", "M", "R"].map((initial) => (
                <div
                  key={initial}
                  className="h-8 w-8 rounded-full bg-gradient-card border-2 border-background grid place-items-center text-xs font-bold text-primary"
                >
                  {initial}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-primary text-primary" />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              <span className="text-foreground font-semibold">500+</span> étudiants satisfaits
            </span>
          </div>

          {/* Stats */}
          <div
            className="animate-fade-up grid grid-cols-3 gap-4 max-w-lg mx-auto"
            style={{ animationDelay: "0.5s" }}
          >
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-border/60 bg-gradient-card p-4 text-center"
              >
                <div className="text-2xl md:text-3xl font-display font-bold text-gradient-orange">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1 leading-tight">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
