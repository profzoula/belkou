import { Star } from "lucide-react";
import { SectionHeader } from "@/components/site/SectionHeader";

const items = [
  { name: "Junior P.", role: "Entrepreneur, Port-au-Prince", text: "En 2 semaines, j'ai lancé mon premier site et décroché mon premier client." },
  { name: "Marie-Claire D.", role: "Designer, Cap-Haïtien", text: "Je n'aurais jamais pensé pouvoir coder. BelKou a changé ma façon de travailler avec la technologie." },
  { name: "Wislande J.", role: "Freelance, Haïti", text: "Le meilleur investissement que j'ai fait cette année. Le mentorat VIP vaut chaque dollar." },
];

export function Testimonials() {
  return (
    <section className="py-20 md:py-24">
      <div className="container mx-auto px-6">
        <SectionHeader
          label="Témoignages"
          title="Ce que disent nos étudiants"
          align="center"
          className="max-w-md"
        />

        <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {items.map((t) => (
            <div key={t.name} className="surface surface-hover rounded-xl p-6 flex flex-col">
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed flex-1 mb-6">"{t.text}"</p>
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-primary-soft text-primary text-sm font-semibold">
                  {t.name.charAt(0)}
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
