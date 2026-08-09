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
      className="border-b border-border/50 bg-[#f5f8fc] py-12 sm:py-14 md:py-16 dark:bg-muted/30"
    >
      <div className="site-container px-4">
        <FadeIn>
          <h2
            id="career-invest-heading"
            className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-[2rem]"
          >
            Investissez dans votre carrière
          </h2>

          <ul className="mt-8 grid gap-8 sm:mt-10 md:grid-cols-3 md:gap-10 lg:gap-12">
            {pillars.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.title} className="min-w-0 text-left">
                  <Icon
                    className="size-7 text-foreground sm:size-8"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                  <h3 className="mt-4 text-base font-bold text-foreground sm:text-lg">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]">
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
