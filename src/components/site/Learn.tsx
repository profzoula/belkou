const modules = [
  {
    n: "01",
    t: "Fondations de l'IA",
    d: "Comprenez comment fonctionnent les outils IA et découvrez ce qui est réellement possible aujourd'hui. Pas de jargon inutile.",
    tag: "Semaine 1",
  },
  {
    n: "02",
    t: "Construisez votre première application",
    d: "De l'idée à une application fonctionnelle et déployée en quelques heures. Vous serez surpris de la vitesse.",
    tag: "Semaine 2",
  },
  {
    n: "03",
    t: "SaaS & Backend",
    d: "Base de données, authentification, paiement — toutes les parties techniques sans se perdre dans la complexité.",
    tag: "Semaine 3",
  },
  {
    n: "04",
    t: "Lancer et vendre",
    d: "Déploiement professionnel, stratégie marketing, acquisition de vos premiers clients payants.",
    tag: "Semaine 4",
  },
];

export function Learn() {
  return (
    <section id="learn" className="py-24 md:py-32 border-t border-border/40">
      <div className="container mx-auto px-6">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="mb-16 md:flex md:items-end md:justify-between">
            <div>
              <span className="chip mb-4 inline-flex">Programme</span>
              <h2 className="text-4xl md:text-5xl font-bold">
                Le parcours{" "}
                <span className="text-gradient-orange">complet</span>
              </h2>
            </div>
            <div className="mt-4 md:mt-0 space-y-2">
              <p className="text-muted-foreground text-sm leading-relaxed md:max-w-xs">
                4 semaines intensives avec mentorat réel et accès à vie au contenu.
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  "🎥 Zoom en direct",
                  "📅 Sam & Dim",
                  "🕙 10h PM",
                  "⏱ 2h / session",
                ].map((tag) => (
                  <span key={tag} className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-medium text-primary">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-4">
            {modules.map((m, i) => (
              <div
                key={m.n}
                className="group relative flex gap-5 rounded-2xl border border-border/50 bg-gradient-card p-6 md:p-7 hover:border-primary/35 hover:shadow-card transition-all duration-300 cursor-default"
              >
                {/* Accent left bar */}
                <div className="absolute left-0 top-4 bottom-4 w-0.5 rounded-full bg-gradient-to-b from-primary/60 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Number */}
                <div className="shrink-0 font-display text-3xl md:text-4xl font-bold text-gradient-orange leading-none pt-1">
                  {m.n}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
                      {m.tag}
                    </span>
                    <h3 className="font-display text-lg md:text-xl font-semibold">{m.t}</h3>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">{m.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
