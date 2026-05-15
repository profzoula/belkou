import { Link } from "@tanstack/react-router";
import { ArrowRight, Star, Video, Calendar, Clock, CheckCircle2, Zap } from "lucide-react";

const pills = [
  { icon: CheckCircle2, label: "Exécution étape par étape" },
  { icon: Zap,          label: "Résultats dès la semaine 1" },
];

const schedule = [
  { icon: Video,    text: "Zoom en direct" },
  { icon: Calendar, text: "2 jours / semaine" },
  { icon: Clock,    text: "10h PM · 2h/session" },
];

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* Ambient orbs */}
      <div className="pointer-events-none absolute top-0 left-0 h-[700px] w-[700px] rounded-full bg-primary/10 blur-[130px] animate-orb -translate-x-1/2 -translate-y-1/4" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-secondary/8 blur-[100px] animate-orb translate-x-1/4 translate-y-1/4" style={{ animationDelay: "6s" }} />

      <div className="container mx-auto px-6 py-20 md:py-28">
        <div className="grid lg:grid-cols-2 gap-12 xl:gap-20 items-center">

          {/* ── LEFT: Text side ── */}
          <div>
            {/* Social proof badge */}
            <div className="animate-fade-up mb-7 flex items-center gap-3" style={{ animationDelay: "0.05s" }}>
              <div className="flex -space-x-2">
                {["J", "S", "K", "M", "R"].map((i) => (
                  <div key={i} className="h-8 w-8 rounded-full border-2 border-background bg-gradient-primary grid place-items-center text-[11px] font-bold text-primary-foreground">
                    {i}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-0.5 mb-0.5">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-3 w-3 fill-primary text-primary" />)}
                </div>
                <p className="text-xs text-muted-foreground">Approuvé par <span className="text-foreground font-semibold">500+</span> étudiants</p>
              </div>
            </div>

            {/* Headline */}
            <h1
              className="animate-fade-up font-display text-5xl font-bold leading-[1.08] tracking-tight md:text-6xl xl:text-[4rem] mb-5"
              style={{ animationDelay: "0.12s" }}
            >
              Apprenez à créer{" "}
              <span className="text-gradient">des Apps IA</span>
              {" "}& des SaaS
            </h1>

            {/* Sub */}
            <p
              className="animate-fade-up text-base md:text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg"
              style={{ animationDelay: "0.2s" }}
            >
              BelKou vous guide de zéro jusqu'au lancement de votre premier projet en 4 semaines — avec mentorat, communauté et outils IA.
            </p>

            {/* CTAs */}
            <div
              className="animate-fade-up flex flex-wrap items-center gap-3 mb-8"
              style={{ animationDelay: "0.28s" }}
            >
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-7 py-3 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90 transition-opacity"
              >
                Commencer maintenant <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#learn"
                className="inline-flex items-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-white/4 transition-all"
              >
                <span className="h-5 w-5 rounded-full border border-border grid place-items-center">
                  <ArrowRight className="h-3 w-3" />
                </span>
                Voir le programme
              </a>
            </div>

            {/* Feature pills */}
            <div
              className="animate-fade-up flex flex-wrap gap-3 mb-8"
              style={{ animationDelay: "0.34s" }}
            >
              {pills.map((p) => (
                <div key={p.label} className="flex items-center gap-2 rounded-xl border border-border/60 bg-gradient-card px-4 py-2.5 text-xs font-medium text-muted-foreground">
                  <p.icon className="h-4 w-4 text-primary shrink-0" />
                  {p.label}
                </div>
              ))}
            </div>

            {/* Schedule row */}
            <div
              className="animate-fade-up flex flex-wrap items-center gap-4"
              style={{ animationDelay: "0.40s" }}
            >
              {schedule.map((s, i) => (
                <div key={s.text} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <s.icon className="h-3.5 w-3.5 text-primary/70" />
                  {s.text}
                  {i < schedule.length - 1 && <span className="ml-2 text-border">·</span>}
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT: Image card ── */}
          <div className="animate-fade-in relative hidden lg:block" style={{ animationDelay: "0.3s" }}>
            {/* Main image card */}
            <div className="relative rounded-2xl overflow-hidden border border-border/60 shadow-float">
              {/* Overlay badge top-left */}
              <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 rounded-full bg-background/80 backdrop-blur border border-border/60 px-3 py-1.5 text-xs font-semibold text-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                Formation en direct · Zoom
              </div>

              <video
                src="/hero-video.mp4"
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-[400px] xl:h-[460px] object-cover"
              />

              {/* Bottom gradient */}
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/90 to-transparent" />

              {/* Stats overlay bottom-right */}
              <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2 rounded-xl bg-background/80 backdrop-blur border border-border/60 px-4 py-2.5">
                <div className="flex -space-x-1.5">
                  {["A","B","C"].map((l) => (
                    <div key={l} className="h-6 w-6 rounded-full bg-gradient-primary border border-background grid place-items-center text-[9px] font-bold text-primary-foreground">{l}</div>
                  ))}
                </div>
                <span className="text-xs font-semibold text-foreground">500+ inscrits</span>
              </div>
            </div>

            {/* Floating stats card */}
            <div className="absolute -bottom-6 -left-6 rounded-2xl border border-border/60 bg-gradient-card shadow-card px-5 py-4 min-w-[160px]">
              <p className="text-2xl font-display font-bold text-gradient-orange mb-0.5">4.9 / 5</p>
              <div className="flex gap-0.5 mb-1">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-3 w-3 fill-primary text-primary" />)}
              </div>
              <p className="text-xs text-muted-foreground">Note des étudiants</p>
            </div>

            {/* Floating badge card */}
            <div className="absolute -top-5 -right-5 rounded-2xl border border-primary/30 bg-gradient-card shadow-glow px-4 py-3 text-center">
              <p className="text-xl font-display font-bold text-gradient-orange">$199</p>
              <p className="text-xs text-muted-foreground">Accès à vie</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
