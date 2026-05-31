import { SectionHeader } from "@/components/site/SectionHeader";

const modules = [
  { n: "01", t: "Fondations de l'IA", d: "Comprenez comment fonctionnent les outils IA et ce qui est possible aujourd'hui.", week: "Semaine 1" },
  { n: "02", t: "Construisez votre première application", d: "De l'idée à l'application fonctionnelle en quelques heures.", week: "Semaine 2" },
  { n: "03", t: "SaaS et Backend", d: "Base de données, authentification, paiement — toutes les parties techniques.", week: "Semaine 3" },
  { n: "04", t: "Lancer et vendre", d: "Déploiement, marketing, vos premiers clients.", week: "Semaine 4" },
];

export function Learn() {
  return (
    <section id="learn" className="py-20 md:py-24">
      <div className="container mx-auto px-6">
        <SectionHeader
          label="Parcours"
          title="4 semaines pour lancer votre projet"
          description="Un parcours structuré pour passer de zéro à votre premier produit en ligne."
          align="center"
          className="max-w-lg"
        />

        <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {modules.map((m) => (
            <div key={m.n} className="surface surface-hover rounded-xl p-6 flex gap-4">
              <div className="shrink-0">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-foreground text-background text-sm font-semibold">
                  {m.n}
                </div>
              </div>
              <div>
                <span className="text-[11px] font-medium uppercase tracking-wide text-primary">{m.week}</span>
                <h3 className="text-[15px] font-semibold mt-1 mb-1.5">{m.t}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{m.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
