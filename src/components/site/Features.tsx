import { Brain, Code2, Zap, Bot, DollarSign, Wrench, Sparkles, Layers } from "lucide-react";

const features = [
  { icon: Brain, title: "Prompt Engineering", desc: "Maîtrisez les prompts pour obtenir des résultats professionnels avec l'IA." },
  { icon: Code2, title: "Cursor & Bolt.new", desc: "Construisez des applications avec des éditeurs intégrant l'IA." },
  { icon: Zap, title: "Replit AI", desc: "Lancez des projets sans configuration complexe." },
  { icon: Layers, title: "APIs & SaaS", desc: "Connectez les services, créez votre propre SaaS." },
  { icon: Wrench, title: "Automatisation", desc: "Automatisez les tâches répétitives avec des workflows." },
  { icon: Bot, title: "Agents IA", desc: "Créez des agents IA qui travaillent pour vous." },
  { icon: DollarSign, title: "Monétisation", desc: "Transformez votre code en argent réel." },
  { icon: Sparkles, title: "VibeCoding", desc: "Une nouvelle façon de créer des logiciels avec l'IA." },
];

export function Features() {
  return (
    <section id="features" className="py-24 md:py-32">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Ce que vous apprendrez</p>
          <h2 className="text-4xl md:text-6xl font-bold">Tout ce dont vous avez besoin<br />pour <span className="text-gradient">vibrer en codant</span></h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="group relative rounded-2xl bg-gradient-card border border-border p-6 hover:border-primary/50 hover:shadow-glow transition-all duration-500"
            >
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-primary shadow-glow mb-4 group-hover:scale-110 transition-transform">
                <f.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
