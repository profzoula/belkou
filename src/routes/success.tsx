import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { CheckCircle2, MessageCircle, Calendar, Mail, Video, Users, KeyRound, LogIn, Copy, Check } from "lucide-react";
import { useState } from "react";
import { getZoomLink } from "@/lib/zoomFn";

const DISCORD_LINK  = "https://discord.gg/VOTRE_CODE";
const WHATSAPP_LINK = "https://chat.whatsapp.com/";

export const Route = createFileRoute("/success")({
  head: () => ({
    meta: [
      { title: "Bienvini! — BelKou Formation" },
      { name: "description", content: "Enskripsyon konfime. Antre nan kominote a." },
    ],
  }),
  validateSearch: z.object({
    plan: z.string().optional(),
    password: z.string().optional(),
    email: z.string().optional(),
  }),
  component: SuccessPage,
});

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button onClick={copy}
      className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 border border-primary/30 rounded-lg px-2.5 py-1 transition-colors">
      {copied ? <><Check className="h-3 w-3" /> Kopye!</> : <><Copy className="h-3 w-3" /> Kopye</>}
    </button>
  );
}

function SuccessPage() {
  const { plan, password, email } = Route.useSearch();
  const [zoomLoading, setZoomLoading] = useState(false);

  async function openZoom() {
    if (!email) return;
    setZoomLoading(true);
    try {
      const res = await getZoomLink({ data: { email } });
      window.open(res.url, "_blank", "noopener");
    } catch {
      alert("Aksè refize. Kontakte administratè a.");
    } finally {
      setZoomLoading(false);
    }
  }

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
          Inscription confirmée{plan ? ` — Plan ${plan.toUpperCase()}` : ""}. Voici vos accès.
        </p>

        <div className="space-y-4 text-left">

          {/* ── Kont Itilizatè ── */}
          {password && (
            <div className="flex items-start gap-4 rounded-2xl bg-gradient-card border-2 border-primary/50 shadow-glow p-5">
              <div className="inline-grid place-items-center h-10 w-10 rounded-xl bg-gradient-primary shrink-0 mt-0.5">
                <KeyRound className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <div className="font-semibold mb-2 text-foreground">Kont ou a kreye — notè modpas la!</div>
                <p className="text-sm text-muted-foreground mb-3">
                  Ou ka konekte ak email ou ak modpas tanporè sa a. Chanje l apre premye koneksyon ou.
                </p>
                <div className="rounded-xl bg-background/60 border border-border p-3 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">Modpas tanporè</span>
                    <CopyButton text={password} />
                  </div>
                  <p className="text-xl font-mono font-bold tracking-widest text-primary">{password}</p>
                </div>
                <Button asChild variant="neon" size="sm">
                  <Link to="/login">
                    <LogIn className="h-4 w-4 mr-2" />
                    Konekte kounye a
                  </Link>
                </Button>
              </div>
            </div>
          )}

          {/* ── Zoom ── */}
          <div className="flex items-start gap-4 rounded-2xl bg-gradient-card border border-primary/30 shadow-glow p-5">
            <div className="inline-grid place-items-center h-10 w-10 rounded-xl bg-gradient-primary shrink-0 mt-0.5">
              <Video className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <div className="font-semibold mb-1">Rejoignez le cours Zoom</div>
              <p className="text-sm text-muted-foreground mb-3">
                Les cours ont lieu <strong className="text-foreground">Samedi & Dimanche à 10h PM</strong>, 2h par session.
              </p>
              <Button variant="neon" size="sm" disabled={zoomLoading || !email} onClick={openZoom}>
                <Video className="h-4 w-4 mr-2" />
                {zoomLoading ? "Chargement…" : "Entrer dans Zoom"}
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
              <p className="text-sm text-muted-foreground mb-3">Kominote a, kesyon, resous formation an.</p>
              <Button asChild size="sm" className="bg-[#5865F2] hover:bg-[#4752C4] text-white border-0">
                <a href={DISCORD_LINK} target="_blank" rel="noreferrer">
                  <Users className="h-4 w-4 mr-2" />Rejoindre Discord
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
              <p className="text-sm text-muted-foreground mb-3">Anons, rapèl kou, ak mizajou enpòtan.</p>
              <Button asChild size="sm" className="bg-green-600 hover:bg-green-700 text-white border-0">
                <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer">
                  <MessageCircle className="h-4 w-4 mr-2" />Rejoindre WhatsApp
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
                La prochaine cohorte commence le <strong className="text-foreground">30 mai</strong>.
              </p>
            </div>
          </div>

          {/* ── Email ── */}
          <div className="flex items-start gap-4 rounded-2xl bg-gradient-card border border-border p-5">
            <Mail className="h-6 w-6 text-primary shrink-0 mt-1" />
            <div>
              <div className="font-semibold mb-1">Vérifiez votre email</div>
              <p className="text-sm text-muted-foreground">
                Détails de paiement et accès arriveront dans quelques minutes.
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
