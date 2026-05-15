const items = [
  "🎁 Les 10 premiers inscrits reçoivent un eBook gratuit sur la formation IA",
  "📅 Début le 30 mai 2026 — Samedi & Dimanche à 10h PM",
  "✅ Paiement unique · Accès à vie · Mentorat inclus",
  "🚀 De zéro au lancement de votre premier projet en 4 semaines",
  "💬 Groupe WhatsApp communautaire + support prioritaire 24/7",
];

const repeated = [...items, ...items];

export function Ticker() {
  return (
    <div className="border-y border-border/40 bg-gradient-card overflow-hidden py-3 select-none">
      <div
        className="flex gap-12 whitespace-nowrap"
        style={{
          animation: "ticker 40s linear infinite",
          width: "max-content",
        }}
      >
        {repeated.map((item, i) => (
          <span key={i} className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
            {item}
            <span className="text-primary/40">✦</span>
          </span>
        ))}
      </div>

      <style>{`
        @keyframes ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
