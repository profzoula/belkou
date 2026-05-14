const modules = [
  { n: "01", t: "Fondations de l'IA", d: "Comprenez comment fonctionnent les outils IA et ce qui est possible aujourd'hui." },
  { n: "02", t: "Construisez votre première application", d: "De l'idée à l'application fonctionnelle en quelques heures." },
  { n: "03", t: "SaaS et Backend", d: "Base de données, authentification, paiement — toutes les parties techniques." },
  { n: "04", t: "Lancer et vendre", d: "Déploiement, marketing, vos premiers clients." },
];

export function Learn() {
  return (
    <section id="learn" className="py-24 md:py-32 relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Parcours</p>
          <h2 className="text-4xl md:text-6xl font-bold">Le parcours <span className="text-gradient-orange">complet</span></h2>
        </div>
        <div className="max-w-3xl mx-auto space-y-4">
          {modules.map((m, i) => (
            <div
              key={m.n}
              className="flex items-start gap-6 rounded-2xl bg-gradient-card border border-border p-6 md:p-8 hover:border-primary/50 hover:translate-x-1 transition-all"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="font-display text-4xl md:text-5xl font-bold text-gradient shrink-0">{m.n}</div>
              <div>
                <h3 className="font-display text-xl md:text-2xl font-semibold mb-2">{m.t}</h3>
                <p className="text-muted-foreground">{m.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
