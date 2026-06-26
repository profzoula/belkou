import { Star } from "lucide-react";
import { SectionHeader } from "@/components/site/SectionHeader";

const items = [
  { name: "Junior P.", role: "Entrepreneur, Port-au-Prince", text: "En 2 semaines, j'ai lancé mon premier site et décroché mon premier client." },
  { name: "Marie-Claire D.", role: "Designer, Cap-Haïtien", text: "Je n'aurais jamais pensé pouvoir coder. BelKou a changé ma façon de travailler avec la technologie." },
  { name: "Wislande J.", role: "Freelance, Haïti", text: "Le meilleur investissement que j'ai fait cette année. Le mentorat VIP vaut chaque dollar." },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="site-section-anchor py-16 sm:py-20 md:py-28">
      <div className="site-container">
        <SectionHeader
          label="Témoignages"
          title="Ce que disent nos étudiants"
          description="Des parcours réels sur plusieurs formations — de Port-au-Prince à la diaspora."
          className="max-w-lg"
        />
        <p className="text-center text-xs text-muted-foreground mb-6 -mt-4">Exemples illustratifs de parcours étudiants.</p>

        <p className="text-center text-[11px] text-muted-foreground mb-3 md:hidden">
          Glissez pour voir les témoignages →
        </p>

        <div className="scroll-carousel md:grid md:grid-cols-3 md:gap-5 max-w-5xl md:mx-auto md:overflow-visible md:pb-0">
          {items.map((t) => (
            <div
              key={t.name}
              className="quote-card surface-hover rounded-2xl p-5 sm:p-6 flex flex-col w-[min(100%,18rem)] min-w-[85vw] sm:min-w-[220px] sm:w-[220px] md:min-w-0 md:w-auto min-h-0"
            >
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed flex-1 mb-6">
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-border mt-auto">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-soft text-primary text-sm font-bold">
                  {t.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{t.name}</div>
                  <div className="text-xs text-muted-foreground leading-tight">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
