import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section className="py-20 md:py-24">
      <div className="container mx-auto px-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-primary p-10 md:p-14 text-center shadow-primary">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,oklch(1_0_0/0.12),transparent_50%)]" />
          <div className="relative max-w-lg mx-auto">
            <h2 className="text-2xl md:text-[1.75rem] font-semibold text-primary-foreground mb-3">
              Prêt à lancer votre projet IA ?
            </h2>
            <p className="text-sm text-primary-foreground/80 mb-8 leading-relaxed">
              Rejoignez la prochaine cohorte. Places limitées, mentorat inclus.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-card text-foreground hover:bg-card/95 shadow-md"
            >
              <Link to="/register">
                S'inscrire maintenant <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
