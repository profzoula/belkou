import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Video, Users, MessageCircle, Calendar, Clock, LogOut, Sparkles, BookOpen } from "lucide-react";

// ── Mete lyen reyèl ou yo isit ─────────────────────────────────────────────
const ZOOM_LINK     = "https://zoom.us/j/VOTRE_ID_ZOOM";
const DISCORD_LINK  = "https://discord.gg/VOTRE_CODE";
const WHATSAPP_LINK = "https://chat.whatsapp.com/";
// ────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [{ title: "Mon Espace — BelKou Formation" }],
  }),
  component: DashboardPage,
});

type Student = { id: number; full_name: string; email: string; plan: string };

function DashboardPage() {
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = sessionStorage.getItem("student_user");
    if (!raw) { navigate({ to: "/login" }); return; }
    try { setStudent(JSON.parse(raw)); }
    catch { navigate({ to: "/login" }); }
  }, [navigate]);

  function logout() {
    sessionStorage.removeItem("student_user");
    navigate({ to: "/" });
  }

  if (!student) return null;

  const schedule = [
    { icon: Calendar, label: "Kòmansman", value: "30 Me 2026" },
    { icon: Calendar, label: "Jou",       value: "Samdi & Dimanch" },
    { icon: Clock,    label: "Lè",        value: "10h PM (Haiti)" },
    { icon: Video,    label: "Duré",      value: "2h / sesyon" },
    { icon: BookOpen, label: "Peryòd",    value: "4 semèn" },
  ];

  return (
    <div className="min-h-screen">
      {/* Topbar */}
      <header className="border-b border-border/50 px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 font-display text-sm font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-primary shadow-glow">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </span>
          BelKou Formation
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground hidden sm:block">
            Bonjou, <span className="font-semibold text-foreground">{student.full_name.split(" ")[0]}</span>
          </span>
          <button onClick={logout}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 hover:border-border/60 transition-all">
            <LogOut className="h-3.5 w-3.5" />
            Déconnexion
          </button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10 max-w-3xl">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">
            Bienvenue, <span className="text-gradient">{student.full_name.split(" ")[0]}</span> !
          </h1>
          <p className="text-muted-foreground text-sm">Plan : <span className="text-primary font-semibold capitalize">{student.plan} — $199</span></p>
        </div>

        <div className="space-y-4">

          {/* ── ZOOM ── */}
          <div className="rounded-2xl border border-primary/30 bg-gradient-card shadow-glow p-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-9 w-9 rounded-xl bg-gradient-primary flex items-center justify-center shrink-0">
                  <Video className="h-4 w-4 text-primary-foreground" />
                </div>
                <h2 className="font-semibold text-foreground">Cours Zoom en direct</h2>
              </div>
              <p className="text-sm text-muted-foreground ml-11">
                Klike pou antre nan kou a. Asire w ou la alè!
              </p>
            </div>
            <a href={ZOOM_LINK} target="_blank" rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90 transition-opacity shrink-0">
              <Video className="h-4 w-4" />
              Entrer dans Zoom
            </a>
          </div>

          {/* ── Orè ── */}
          <div className="rounded-2xl border border-border bg-gradient-card p-5">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Orè formation an
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {schedule.map((s) => (
                <div key={s.label} className="rounded-xl bg-background/40 border border-border/60 p-3 text-center">
                  <s.icon className="h-4 w-4 text-primary mx-auto mb-1.5" />
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">{s.label}</p>
                  <p className="text-xs font-semibold text-foreground">{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Discord ── */}
          <div className="rounded-2xl border border-border bg-gradient-card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-9 w-9 rounded-xl bg-[#5865F2]/20 border border-[#5865F2]/40 flex items-center justify-center shrink-0">
                  <Users className="h-4 w-4 text-[#5865F2]" />
                </div>
                <h2 className="font-semibold text-foreground">Serveur Discord</h2>
              </div>
              <p className="text-sm text-muted-foreground ml-11">Kominote a — poze kesyon, jwenn èd, pataje pwojè w.</p>
            </div>
            <a href={DISCORD_LINK} target="_blank" rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] px-5 py-2.5 text-sm font-semibold text-white transition-colors shrink-0">
              <Users className="h-4 w-4" />
              Rejoindre Discord
            </a>
          </div>

          {/* ── WhatsApp ── */}
          <div className="rounded-2xl border border-border bg-gradient-card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-9 w-9 rounded-xl bg-green-500/20 border border-green-500/40 flex items-center justify-center shrink-0">
                  <MessageCircle className="h-4 w-4 text-green-400" />
                </div>
                <h2 className="font-semibold text-foreground">Groupe WhatsApp</h2>
              </div>
              <p className="text-sm text-muted-foreground ml-11">Resevwa anons, rapèl kou, ak mizajou enpòtan yo.</p>
            </div>
            <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 hover:bg-green-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors shrink-0">
              <MessageCircle className="h-4 w-4" />
              Rejoindre WhatsApp
            </a>
          </div>

        </div>
      </main>
    </div>
  );
}
