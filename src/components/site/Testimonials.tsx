const items = [
  { name: "Jeff M.", role: "Etudiant", text: "En 2 semaines, j'ai lancé ma propre page d'accueil et j'ai trouvé mon premier client." },
  { name: "Sandra L.", role: "Designer", text: "Je n'aurais jamais pensé que je pourrais coder. VibeCoding a changé ma vie." },
  { name: "Kervens P.", role: "Entrepreneur", text: "Le meilleur investissement que j'ai fait cette année. Le mentorat est un cadeau." },
];

export function Testimonials() {
  return (
    <section className="py-24 md:py-32">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Témoignages</p>
          <h2 className="text-4xl md:text-6xl font-bold">Ce que disent les <span className="text-gradient">étudiants</span></h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {items.map((t) => (
            <div key={t.name} className="rounded-2xl bg-gradient-card border border-border p-8 hover:shadow-glow-purple transition-all duration-500">
              <div className="text-4xl text-gradient-orange mb-4">"</div>
              <p className="text-foreground/90 mb-6 leading-relaxed">{t.text}</p>
              <div>
                <div className="font-semibold">{t.name}</div>
                <div className="text-sm text-muted-foreground">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
