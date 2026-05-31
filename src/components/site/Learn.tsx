import { SectionHeader } from "@/components/site/SectionHeader";

const modules = [
  { n: "01", t: "Fondations de l'IA", d: "Comprenez comment fonctionnent les outils IA et ce qui est possible aujourd'hui.", week: "Semaine 1" },
  { n: "02", t: "Construisez votre première application", d: "De l'idée à l'application fonctionnelle en quelques heures.", week: "Semaine 2" },
  { n: "03", t: "SaaS et Backend", d: "Base de données, authentification, paiement — toutes les parties techniques.", week: "Semaine 3" },
  { n: "04", t: "Lancer et vendre", d: "Déploiement, marketing, vos premiers clients.", week: "Semaine 4" },
];

export function Learn() {
  return (
    <section id="learn" className="py-16 sm:py-20 md:py-24">
      <div className="site-container">
        <SectionHeader
          label="Parcours"
          title="4 semaines pour lancer votre projet"
          description="Un parcours structuré pour passer de zéro à votre premier produit en ligne."
          align="center"
          className="max-w-lg"
        />

        <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-4xl mx-auto">
          {modules.map((m) => (
            <div
              key={m.n}
              className="surface surface-hover rounded-xl p-3.5 sm:p-6 flex flex-col sm:flex-row gap-3 sm:gap-4 min-w-0"
            >
              <div className="shrink-0">
                <div className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-lg bg-foreground text-background text-xs sm:text-sm font-semibold">
                  {m.n}
                </div>
              </div>
              <div className="min-w-0">
                <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wide text-primary">
                  {m.week}
                </span>
                <h3 className="text-[13px] sm:text-[15px] font-semibold mt-0.5 sm:mt-1 mb-1 sm:mb-1.5 leading-snug">
                  {m.t}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{m.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
