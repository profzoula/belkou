import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section className="py-16 sm:py-20 md:py-28">
      <div className="site-container">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-brand p-8 sm:p-12 md:p-16 text-center shadow-primary">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,oklch(1_0_0/0.15),transparent_50%)]" />
          <div className="relative max-w-lg mx-auto">
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-primary-foreground mb-4 text-balance">
              Prêt à lancer votre projet IA ?
            </h2>
            <p className="text-sm sm:text-base text-primary-foreground/85 mb-8 leading-relaxed">
              Rejoignez la prochaine cohorte. Places limitées, mentorat inclus.
            </p>
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto touch-target bg-card text-foreground hover:bg-card/95 shadow-md px-8"
            >
              <Link to="/register">
                S&apos;inscrire maintenant <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
