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
    <section id="features" className="section-divider py-20 md:py-24 bg-card">
      <div className="container mx-auto px-6">
        <SectionHeader
          label="Compétences"
          title="Tout ce qu'il faut pour coder avec l'IA"
          description="8 modules pratiques couvrant la stack moderne du développement assisté par intelligence artificielle."
          align="center"
          className="max-w-xl"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="surface surface-hover rounded-xl p-5"
            >
              <div className="icon-box mb-4">
                <f.icon className="h-[1.125rem] w-[1.125rem]" />
              </div>
              <h3 className="text-[15px] font-semibold mb-1.5">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
