import { Link } from "@tanstack/react-router";
import { Rocket, ShieldCheck, Clock } from "lucide-react";

export function CTA() {
  return (
    <section className="py-24 border-t border-border/40">
      <div className="container mx-auto px-6">
        <div className="relative overflow-hidden rounded-3xl border border-primary/25 bg-gradient-card shadow-glow">
          {/* Background glows */}
          <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl animate-orb" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-secondary/20 blur-3xl animate-orb" style={{ animationDelay: "5s" }} />

          {/* Grid pattern overlay */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "40px 40px"
            }}
          />

          <div className="relative px-8 py-16 md:px-16 md:py-20 text-center">
            <span className="chip mb-6 inline-flex">Rejoignez-nous</span>

            <h2 className="text-4xl md:text-6xl font-bold mb-5">
              Prêt à lancer votre{" "}
              <span className="text-gradient">première App IA</span> ?
            </h2>
            <p className="text-muted-foreground text-lg mb-10 max-w-lg mx-auto">
              Rejoignez la cohorte aujourd'hui. Les places sont limitées et se remplissent vite.
            </p>

            <a
              href="https://buy.stripe.com/9B6aEZ792gOh96ja7G4F202"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-glow hover:opacity-90 transition-opacity"
            >
              <Rocket className="h-4 w-4" /> S'inscrire Maintenant
            </a>

            {/* Trust signals */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Remboursement 7 jours garanti
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Accès immédiat après paiement
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
