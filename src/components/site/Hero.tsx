import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Play, Star } from "lucide-react";
import { formatCount } from "@/lib/courses";

type HeroProps = {
  studentCount: number;
};

const ease = [0.22, 1, 0.36, 1] as const;

export function Hero({ studentCount }: HeroProps) {
  const reduceMotion = useReducedMotion();
  const studentLabel = formatCount(studentCount);

  return (
    <section className="relative overflow-hidden bg-background site-page-top">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgb(0_70_213_/_0.12),transparent_55%)]"
      />
      <img
        src="/hero/bg-with-grid.png"
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.55]"
        width={1200}
        height={800}
      />

      <div className="site-container relative grid grid-cols-[1.15fr_0.85fr] items-center gap-3 px-4 pb-4 pt-5 sm:gap-8 sm:pb-8 sm:pt-10 md:grid-cols-[1.05fr_0.95fr] md:gap-10 md:pb-10 md:pt-8 lg:gap-14">
        <motion.div
          className="flex min-w-0 flex-col items-start text-left"
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
        >
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground sm:gap-2 sm:text-sm">
            <span className="inline-flex items-center gap-0.5 text-brand-accent" aria-label="5 étoiles">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star key={index} className="size-2.5 fill-current sm:size-3.5" />
              ))}
            </span>
            <span>
              Utilisé par <span className="font-semibold text-foreground">{studentLabel}+</span>{" "}
              étudiants
            </span>
          </div>

          <h1 className="mt-3 font-display text-[1.35rem] font-bold leading-[1.12] tracking-tight text-foreground text-balance sm:mt-5 sm:text-4xl md:text-5xl lg:text-[3.4rem]">
            Des compétences qui vous font{" "}
            <span className="text-primary">embaucher</span>
          </h1>

          <p className="mt-2 max-w-lg text-[11px] leading-relaxed text-muted-foreground sm:mt-4 sm:text-base md:text-lg">
            Parcours premium pour bâtir des apps IA et SaaS — de l&apos;idée au déploiement, avec
            mentors et projets concrets.
          </p>

          <div className="mt-4 flex flex-nowrap items-center gap-2 sm:mt-7 sm:gap-3">
            <Link
              to="/courses"
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1 rounded-full bg-primary px-4 text-xs font-semibold whitespace-nowrap text-primary-foreground shadow-primary transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-12 sm:gap-2 sm:px-7 sm:text-sm"
            >
              Commencer
              <ArrowRight className="size-3 sm:size-4" aria-hidden />
            </Link>
            <Link
              to="/courses"
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1 rounded-full border border-border bg-card px-4 text-xs font-semibold whitespace-nowrap text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-12 sm:gap-2 sm:px-7 sm:text-sm"
            >
              <Play className="size-3 text-primary sm:size-4" aria-hidden />
              Voir les cours
            </Link>
          </div>
        </motion.div>

        <motion.div
          className="relative justify-self-end"
          initial={reduceMotion ? false : { opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, delay: 0.08, ease }}
        >
          <div
            aria-hidden
            className="absolute inset-x-6 bottom-6 h-28 rounded-[100%] bg-primary/20 blur-3xl"
          />
          <img
            src="/hero/student.png"
            alt="Diplômée BelKou prête pour sa carrière"
            className="relative z-10 mx-auto h-auto w-full max-h-[min(52vh,380px)] object-contain object-bottom sm:max-h-[min(68vh,620px)] md:max-h-[min(76vh,680px)] md:scale-105"
            width={900}
            height={1200}
            fetchPriority="high"
          />
        </motion.div>
      </div>
    </section>
  );
}
