import { Link } from "@tanstack/react-router";
import { Bot, CreditCard, Rocket, Sparkles, Workflow } from "lucide-react";
import { SectionHeader } from "@/components/site/SectionHeader";

const categories = [
  {
    icon: Bot,
    title: "Apps & IA",
    description: "Cursor, Claude Code, prompts et génération de code",
    gradient: "from-violet-600 via-indigo-600 to-blue-700",
  },
  {
    icon: Workflow,
    title: "SaaS & Backend",
    description: "Auth, Supabase, API sécurisées et dashboards",
    gradient: "from-sky-500 via-cyan-600 to-teal-700",
  },
  {
    icon: Rocket,
    title: "Déploiement",
    description: "Railway, Cloudflare, domaines et production",
    gradient: "from-orange-500 via-amber-500 to-yellow-600",
  },
  {
    icon: CreditCard,
    title: "Monétisation",
    description: "Stripe, webhooks, PayPal et MonCash",
    gradient: "from-rose-500 via-pink-600 to-fuchsia-700",
  },
  {
    icon: Sparkles,
    title: "Automatisation",
    description: "Workflows IA, agents et productivité",
    gradient: "from-emerald-500 via-teal-600 to-cyan-700",
  },
];

export function CourseCategories() {
  return (
    <section id="categories" className="site-section-anchor section-divider section-alt py-16 sm:py-20 md:py-24">
      <div className="site-container">
        <SectionHeader
          label="Catégories"
          title="Trouvez la compétence qui vous intéresse"
          description="Des formations ciblées pour chaque étape de votre parcours — du premier prompt au premier client."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {categories.map((cat) => (
            <Link
              key={cat.title}
              to="/courses"
              className="group surface surface-hover rounded-2xl p-5 sm:p-6 flex gap-4 min-w-0 transition-all hover:border-primary/20"
            >
              <div
                className={`shrink-0 grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${cat.gradient} text-white shadow-sm`}
              >
                <cat.icon className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold group-hover:text-primary transition-colors">{cat.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{cat.description}</p>
              </div>
            </Link>
          ))}

          <Link
            to="/courses"
            className="group surface surface-hover rounded-2xl p-5 sm:p-6 flex flex-col justify-center items-center text-center min-h-[120px] border-dashed border-2 border-border hover:border-primary/40 transition-all sm:col-span-2 lg:col-span-1"
          >
            <span className="text-sm font-semibold text-primary group-hover:underline">Voir tout le catalogue →</span>
            <span className="mt-1 text-xs text-muted-foreground">Nouveaux cours ajoutés régulièrement</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
