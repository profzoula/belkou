import { Brain, Code2, Zap, Bot, DollarSign, Wrench, Sparkles, Layers } from "lucide-react";

const features = [
  { icon: Brain, title: "Prompt Engineering", desc: "Maîtrisez les prompts pour produire des résultats professionnels avec l'IA.", color: "text-primary" },
  { icon: Code2, title: "Cursor & Bolt.new", desc: "Construisez des applications complètes avec les meilleurs éditeurs IA.", color: "text-accent" },
  { icon: Zap, title: "Replit AI", desc: "Déployez des projets rapidement sans configuration complexe.", color: "text-primary" },
  { icon: Layers, title: "APIs & SaaS", desc: "Connectez des services, créez votre propre produit SaaS.", color: "text-secondary" },
  { icon: Wrench, title: "Automatisation", desc: "Automatisez les tâches répétitives avec des workflows intelligents.", color: "text-accent" },
  { icon: Bot, title: "Agents IA", desc: "Créez des agents IA autonomes qui travaillent pour vous.", color: "text-primary" },
  { icon: DollarSign, title: "Monétisation", desc: "Transformez vos créations en revenus réels dès le premier mois.", color: "text-secondary" },
  { icon: Sparkles, title: "Méthode BelKou", desc: "Une approche moderne et rapide pour lancer sans friction.", color: "text-accent" },
];

export function Features() {
  return (
    <section id="features" className="py-24 md:py-32 border-t border-border/40">
      <div className="container mx-auto px-6">

        {/* Header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <span className="chip mb-4 inline-flex">Ce que vous apprendrez</span>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Tout ce qu'il faut pour{" "}
            <span className="text-gradient">réussir avec l'IA</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            8 modules pratiques pour maîtriser les outils IA modernes et lancer votre projet.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="group feature-card rounded-2xl p-6 cursor-default"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className={`mb-4 inline-grid h-11 w-11 place-items-center rounded-xl bg-white/5 border border-white/8 group-hover:border-primary/30 transition-colors`}>
                <f.icon className={`h-5 w-5 ${f.color}`} />
              </div>
              <h3 className="font-display font-semibold text-base mb-1.5 text-foreground">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
