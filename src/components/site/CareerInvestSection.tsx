import { Award, Star, Target } from "lucide-react";
import { FadeIn } from "@/components/motion/FadeIn";

const pillars = [
  {
    icon: Target,
    title: "Explorez de nouvelles compétences",
    description:
      "Accédez à des formations en IA, Vibe Coding, web et mobile. Choisissez le cours qui correspond à votre objectif.",
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
      className="border-t border-border/50 bg-[#f5f8fc] py-12 sm:py-16 dark:bg-muted/30"
    >
      <div className="site-container px-4">
        <FadeIn>
          <h2
            id="career-invest-heading"
            className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-[1.75rem]"
          >
            Investissez dans votre carrière
          </h2>

          <ul className="-mx-4 mt-5 flex snap-x snap-mandatory scroll-pl-4 gap-3 overflow-x-auto overscroll-x-contain px-4 pb-1 sm:mt-6 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-8 lg:overflow-visible lg:px-0 lg:pb-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {pillars.map((item) => {
              const Icon = item.icon;
              return (
                <li
                  key={item.title}
                  className="w-[76%] min-w-0 max-w-[17rem] shrink-0 snap-start rounded-2xl border border-border/60 bg-card p-4 text-left sm:w-[46%] lg:w-auto lg:max-w-none lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0"
                >
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
