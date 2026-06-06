import { Brain, Code2, Zap, Bot, DollarSign, Wrench, Sparkles, Layers } from "lucide-react";
import { SectionHeader } from "@/components/site/SectionHeader";

const features = [
  { icon: Brain, title: "Prompt Engineering", desc: "Maîtrisez les prompts pour obtenir des résultats professionnels avec l'IA." },
  { icon: Code2, title: "Cursor & Bolt.new", desc: "Construisez des applications avec des éditeurs intégrant l'IA." },
  { icon: Zap, title: "Replit AI", desc: "Lancez des projets sans configuration complexe." },
  { icon: Layers, title: "APIs & SaaS", desc: "Connectez les services, créez votre propre SaaS." },
  { icon: Wrench, title: "Automatisation", desc: "Automatisez les tâches répétitives avec des workflows." },
  { icon: Bot, title: "Agents IA", desc: "Créez des agents IA qui travaillent pour vous." },
  { icon: DollarSign, title: "Monétisation", desc: "Transformez votre code en argent réel." },
  { icon: Sparkles, title: "Méthode BelKou", desc: "Une approche structurée pour créer des logiciels avec l'IA." },
];

export function Features() {
  return (
    <section id="features" className="section-divider py-16 sm:py-20 md:py-28">
      <div className="site-container">
        <SectionHeader
          label="Compétences"
          title="Tout ce qu'il faut pour coder avec l'IA"
          description="8 modules pratiques couvrant la stack moderne du développement assisté par intelligence artificielle."
          className="max-w-xl"
        />

        <p className="text-center text-xs text-muted-foreground -mt-6 mb-8 sm:mb-10">
          Conçu pour les équipes et entrepreneurs qui veulent lancer vite.
        </p>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 max-w-5xl mx-auto">
          {features.map((f, i) => (
            <div
              key={f.title}
              className={`surface surface-hover rounded-2xl p-4 sm:p-6 min-w-0 ${i === features.length - 1 ? "brand-feature lg:col-span-1" : ""}`}
            >
              <div className="icon-box mb-4 h-10 w-10">
                <f.icon className="h-[1.125rem] w-[1.125rem]" />
              </div>
              <h3 className="text-sm sm:text-base font-semibold mb-2 leading-snug">{f.title}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
