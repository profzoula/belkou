import { Link } from "@tanstack/react-router";
import { Bot, CreditCard, Rocket, Sparkles } from "lucide-react";
import { SectionHeader } from "@/components/site/SectionHeader";
import { formatCount } from "@/lib/courses";

const categories = [
  {
    icon: Bot,
    title: "Apps & IA",
    description: "Cursor, Claude, prompts et génération de code assistée",
    gradient: "from-violet-600 via-indigo-600 to-blue-700",
  },
  {
    icon: Rocket,
    title: "Déploiement",
    description: "Railway, Cloudflare, domaines et mise en production",
    gradient: "from-indigo-600 via-violet-600 to-blue-700",
  },
  {
    icon: CreditCard,
    title: "Monétisation",
    description: "Stripe, webhooks, PayPal et MonCash dans vos apps",
    gradient: "from-rose-500 via-pink-600 to-fuchsia-700",
  },
  {
    icon: Sparkles,
    title: "Automatisation",
    description: "Workflows IA, agents et productivité développeur",
    gradient: "from-emerald-500 via-teal-600 to-cyan-700",
  },
];

type CourseCategoriesProps = {
  courseCount?: number;
};

export function CourseCategories({ courseCount = 0 }: CourseCategoriesProps) {
  return (
    <section id="categories" className="site-section-anchor section-divider section-alt py-16 sm:py-20 md:py-24">
      <div className="site-container">
        <SectionHeader
          label="Thématiques"
          title="Des compétences pour chaque objectif"
          description={
            courseCount > 0
              ? `${formatCount(courseCount)} cours couvrent ces domaines — et le catalogue s'enrichit.`
              : "Le catalogue couvre ces domaines — de nouvelles formations arrivent régulièrement."
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
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
        </div>

        <div className="mt-8 text-center">
          <Link to="/courses" className="text-sm font-semibold text-primary hover:underline">
            Parcourir tout le catalogue →
          </Link>
        </div>
      </div>
    </section>
  );
}
