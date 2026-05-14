import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Rocket } from "lucide-react";

export function CTA() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-card border border-primary/30 p-12 md:p-16 text-center shadow-glow">
          <div className="absolute -top-32 -right-32 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 h-72 w-72 rounded-full bg-secondary/30 blur-3xl" />
          <div className="relative">
            <h2 className="text-4xl md:text-6xl font-bold mb-4">Prêt à <span className="text-gradient">vibrer en codant</span> ?</h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
              Rejoignez la cohorte aujourd'hui. Les places sont limitées.
            </p>
            <Button asChild variant="hero" size="xl">
              <Link to="/register"><Rocket /> S'inscrire Maintenant</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
