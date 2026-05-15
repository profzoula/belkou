import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { CheckCircle2, MessageCircle, Calendar, Mail, Video, Users } from "lucide-react";

// ── Mete lyen reyèl ou yo isit ──────────────────────────────────────────────
const ZOOM_LINK    = "https://zoom.us/j/VOTRE_ID_ZOOM";   // ← chanje
const DISCORD_LINK = "https://discord.gg/VOTRE_CODE";     // ← chanje
const WHATSAPP_LINK = "https://chat.whatsapp.com/";       // ← chanje
// ─────────────────────────────────────────────────────────────────────────────

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
        <h1 className="text-4xl md:text-5xl font-bold mb-3">
          Bienvenue dans <span className="text-gradient">la cohorte</span> !
        </h1>
        <p className="text-muted-foreground text-lg mb-10">
          Inscription confirmée{plan ? ` pour le plan ${plan.toUpperCase()}` : ""}. Voici les prochaines étapes.
        </p>

        <div className="space-y-4 text-left">

          {/* ── Zoom ── */}
          <div className="flex items-start gap-4 rounded-2xl bg-gradient-card border border-primary/30 shadow-glow p-5">
            <div className="inline-grid place-items-center h-10 w-10 rounded-xl bg-gradient-primary shrink-0 mt-0.5">
              <Video className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <div className="font-semibold mb-1">Rejoignez le cours Zoom</div>
              <p className="text-sm text-muted-foreground mb-3">
                Les cours ont lieu <strong className="text-foreground">2 fois par semaine à 10h PM</strong>, 2h par session. Cliquez pour entrer en direct.
              </p>
              <Button asChild variant="neon" size="sm">
                <a href={ZOOM_LINK} target="_blank" rel="noreferrer">
                  <Video className="h-4 w-4 mr-2" />
                  Entrer dans Zoom
                </a>
              </Button>
            </div>
          </div>

          {/* ── Discord ── */}
          <div className="flex items-start gap-4 rounded-2xl bg-gradient-card border border-border p-5">
            <div className="inline-grid place-items-center h-10 w-10 rounded-xl bg-[#5865F2]/20 border border-[#5865F2]/40 shrink-0 mt-0.5">
              <Users className="h-5 w-5 text-[#5865F2]" />
            </div>
            <div className="flex-1">
              <div className="font-semibold mb-1">Rejoignez le serveur Discord</div>
              <p className="text-sm text-muted-foreground mb-3">
                Discutez avec les autres étudiants, posez vos questions et accédez aux ressources de la formation.
              </p>
              <Button asChild size="sm" className="bg-[#5865F2] hover:bg-[#4752C4] text-white border-0">
                <a href={DISCORD_LINK} target="_blank" rel="noreferrer">
                  <Users className="h-4 w-4 mr-2" />
                  Rejoindre Discord
                </a>
              </Button>
            </div>
          </div>

          {/* ── WhatsApp ── */}
          <div className="flex items-start gap-4 rounded-2xl bg-gradient-card border border-border p-5">
            <div className="inline-grid place-items-center h-10 w-10 rounded-xl bg-green-500/20 border border-green-500/40 shrink-0 mt-0.5">
              <MessageCircle className="h-5 w-5 text-green-400" />
            </div>
            <div className="flex-1">
              <div className="font-semibold mb-1">Groupe WhatsApp</div>
              <p className="text-sm text-muted-foreground mb-3">
                Connectez-vous avec d'autres étudiants et mentors pour les annonces importantes.
              </p>
              <Button asChild size="sm" className="bg-green-600 hover:bg-green-700 text-white border-0">
                <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Rejoindre WhatsApp
                </a>
              </Button>
            </div>
          </div>

          {/* ── Kalann ── */}
          <div className="flex items-start gap-4 rounded-2xl bg-gradient-card border border-border p-5">
            <Calendar className="h-6 w-6 text-primary shrink-0 mt-1" />
            <div>
              <div className="font-semibold mb-1">Date de la formation</div>
              <p className="text-sm text-muted-foreground">
                La prochaine cohorte commence le 1er du mois prochain. Vous recevrez l'emploi du temps complet par email.
              </p>
            </div>
          </div>

          {/* ── Email ── */}
          <div className="flex items-start gap-4 rounded-2xl bg-gradient-card border border-border p-5">
            <Mail className="h-6 w-6 text-primary shrink-0 mt-1" />
            <div>
              <div className="font-semibold mb-1">Vérifiez votre email</div>
              <p className="text-sm text-muted-foreground">
                Un email de confirmation arrivera dans quelques minutes avec les détails de paiement et l'accès.
              </p>
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
