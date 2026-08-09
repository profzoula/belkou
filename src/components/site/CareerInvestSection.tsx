import { Award, Star, Target } from "lucide-react";
import { FadeIn } from "@/components/motion/FadeIn";

const pillars = [
  {
    icon: Target,
    title: "Explorez de nouvelles compétences",
    description:
      "Accédez à des formations en IA, Vibe Coding, web et mobile — choisissez le cours qui correspond à votre objectif.",
  },
  {
    icon: Award,
    title: "Obtenez des résultats concrets",
    description:
      "Progressez leçon par leçon, terminez des projets réels et renforcez votre profil pour décrocher plus d'opportunités.",
  },
  {
    icon: Star,
    title: "Apprenez avec les meilleurs",
    description:
      "Des parcours structurés, des mentors expérimentés et un accompagnement pensé pour la diaspora francophone.",
  },
] as const;

export function CareerInvestSection() {
  return (
    <section
      aria-labelledby="career-invest-heading"
      className="border-b border-border/50 bg-[#f5f8fc] py-8 sm:py-10 dark:bg-muted/30"
    >
      <div className="site-container px-4">
        <FadeIn>
          <h2
            id="career-invest-heading"
            className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl"
          >
            Investissez dans votre carrière
          </h2>

          <ul className="mt-5 grid gap-6 sm:mt-6 md:grid-cols-3 md:gap-8">
            {pillars.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.title} className="min-w-0 text-left">
                  <Icon
                    className="size-5 text-foreground sm:size-6"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                  <h3 className="mt-2.5 text-sm font-semibold text-foreground sm:text-[0.9375rem]">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                    {item.description}
                  </p>
                </li>
              );
            })}
          </ul>
        </FadeIn>
      </div>
    </section>
  );
}
