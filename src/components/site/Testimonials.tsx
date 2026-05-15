import { Star } from "lucide-react";

const items = [
  {
    name: "Jeff M.",
    role: "Étudiant",
    initials: "JM",
    text: "En 2 semaines, j'ai lancé ma propre page d'accueil et j'ai trouvé mon premier client. Je n'aurais jamais cru que c'était possible aussi vite.",
    stars: 5,
  },
  {
    name: "Sandra L.",
    role: "Designer",
    initials: "SL",
    text: "Je n'aurais jamais pensé que je pourrais coder. BelKou a vraiment changé ma façon de voir les choses — l'IA est un super-pouvoir.",
    stars: 5,
  },
  {
    name: "Kervens P.",
    role: "Entrepreneur",
    initials: "KP",
    text: "Le meilleur investissement que j'ai fait cette année. Le mentorat est exceptionnel et la communauté est très active et motivante.",
    stars: 5,
  },
];

export function Testimonials() {
  return (
    <section className="py-24 md:py-32 border-t border-border/40">
      <div className="container mx-auto px-6">

        {/* Header */}
        <div className="max-w-xl mx-auto text-center mb-16">
          <span className="chip mb-4 inline-flex">Témoignages</span>
          <h2 className="text-4xl md:text-5xl font-bold">
            Ce que disent nos{" "}
            <span className="text-gradient">étudiants</span>
          </h2>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {items.map((t) => (
            <div
              key={t.name}
              className="group flex flex-col rounded-2xl border border-border/50 bg-gradient-card p-7 hover:border-primary/30 hover:shadow-card transition-all duration-300"
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-5">
                {[...Array(t.stars)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-foreground/85 text-sm leading-relaxed flex-1 mb-6">
                "{t.text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-5 border-t border-border/50">
                <div className="h-9 w-9 rounded-full bg-gradient-primary grid place-items-center text-primary-foreground text-xs font-bold shrink-0">
                  {t.initials}
                </div>
                <div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
