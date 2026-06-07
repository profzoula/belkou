import { SectionHeader } from "@/components/site/SectionHeader";

const modules = [
  { n: "01", t: "Fondations de l'IA", d: "Comprenez comment fonctionnent les outils IA et ce qui est possible aujourd'hui.", week: "Semaine 1" },
  { n: "02", t: "Construisez votre première application", d: "De l'idée à l'application fonctionnelle en quelques heures.", week: "Semaine 2" },
  { n: "03", t: "SaaS et Backend", d: "Base de données, authentification, paiement — toutes les parties techniques.", week: "Semaine 3" },
  { n: "04", t: "Lancer et vendre", d: "Déploiement, marketing, vos premiers clients.", week: "Semaine 4" },
];

export function Learn() {
  return (
    <section id="learn" className="site-section-anchor section-divider py-16 sm:py-20 md:py-28">
      <div className="site-container">
        <SectionHeader
          label="Parcours"
          title="8 semaines pour lancer votre projet"
          description="Un parcours structuré en 4 phases — sur 8 semaines (ou 6 en intensif) — pour passer de zéro à votre premier produit en ligne."
          className="max-w-lg"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {modules.map((m) => (
            <div
              key={m.n}
              className="surface surface-hover rounded-2xl p-5 sm:p-6 flex gap-4 min-w-0"
            >
              <div className="shrink-0">
                <div className="module-num grid h-10 w-10 place-items-center rounded-xl text-sm font-bold">
                  {m.n}
                </div>
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                  {m.week}
                </span>
                <h3 className="text-base font-semibold mt-1 mb-2 leading-snug">{m.t}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{m.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
