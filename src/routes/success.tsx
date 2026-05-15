import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { CheckCircle2, MessageCircle, Calendar, Mail } from "lucide-react";

export const Route = createFileRoute("/success")({
  head: () => ({
    meta: [
      { title: "Bienvini! — BelKou Formation" },
      { name: "description", content: "Enskripsyon konfime. Antre nan kominote a." },
    ],
  }),
  validateSearch: z.object({ plan: z.string().optional() }),
  component: SuccessPage,
});

function SuccessPage() {
  const { plan } = Route.useSearch();
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-6 pt-32 pb-20 max-w-2xl text-center">
        <div className="inline-grid place-items-center h-20 w-20 rounded-full bg-gradient-primary shadow-glow mb-6 animate-pulse-glow">
          <CheckCircle2 className="h-10 w-10 text-primary-foreground" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-3">Bienvenue dans <span className="text-gradient">la cohorte</span> !</h1>
        <p className="text-muted-foreground text-lg mb-10">
          Inscription confirmée{plan ? ` pour le plan ${plan.toUpperCase()}` : ""}. Voici les prochaines étapes.
        </p>

        <div className="space-y-4 text-left">
          <div className="flex items-start gap-4 rounded-2xl bg-gradient-card border border-border p-5">
            <MessageCircle className="h-6 w-6 text-primary shrink-0 mt-1" />
            <div>
              <div className="font-semibold mb-1">Rejoignez le groupe WhatsApp</div>
              <p className="text-sm text-muted-foreground mb-3">Connectez-vous avec d'autres étudiants et mentors.</p>
              <Button asChild variant="neon" size="sm">
                <a href="https://chat.whatsapp.com/" target="_blank" rel="noreferrer">Rejoindre maintenant</a>
              </Button>
            </div>
          </div>

          <div className="flex items-start gap-4 rounded-2xl bg-gradient-card border border-border p-5">
            <Calendar className="h-6 w-6 text-primary shrink-0 mt-1" />
            <div>
              <div className="font-semibold mb-1">Date de la formation</div>
              <p className="text-sm text-muted-foreground">La prochaine cohorte commence le 1er du mois prochain. Vous recevrez l'emploi du temps complet par email.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 rounded-2xl bg-gradient-card border border-border p-5">
            <Mail className="h-6 w-6 text-primary shrink-0 mt-1" />
            <div>
              <div className="font-semibold mb-1">Vérifiez votre email</div>
              <p className="text-sm text-muted-foreground">Un email de confirmation arrivera dans quelques minutes avec les détails de paiement et l'accès.</p>
            </div>
          </div>
        </div>

        <Button asChild variant="hero" size="lg" className="mt-10">
          <Link to="/">Retour à la page d'accueil</Link>
        </Button>
      </main>
      <Footer />
    </div>
  );
}
