import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Play, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCount } from "@/lib/courses";
import { siteConfig } from "@/lib/site-config";
import { toolLogos } from "@/lib/tool-logos";

type HeroProps = {
  studentCount: number;
};

const ease = [0.22, 1, 0.36, 1] as const;

export function Hero({ studentCount }: HeroProps) {
  const reduceMotion = useReducedMotion();
  const studentLabel = formatCount(studentCount);
  const tools = toolLogos.slice(0, 5);

  return (
    <section className="relative isolate overflow-hidden bg-background site-page-top">
      {/* Full-bleed visual plane */}
      <div aria-hidden className="absolute inset-0 bg-gradient-mesh" />
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgb(0_70_213_/_0.16),transparent_55%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,rgb(15_23_42_/_0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgb(15_23_42_/_0.045)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:linear-gradient(to_bottom,black_35%,transparent_95%)] dark:opacity-25"
      />
      <div
        aria-hidden
        className="absolute -right-24 top-24 size-[28rem] rounded-full bg-primary/10 blur-3xl md:size-[36rem]"
      />
      <div
        aria-hidden
        className="absolute -left-20 bottom-10 size-[22rem] rounded-full bg-brand-accent/15 blur-3xl"
      />

      <div className="site-container relative flex min-h-[calc(100dvh-var(--site-header-height))] flex-col justify-center px-4 pb-24 pt-12 md:pb-32 md:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <motion.p
            className="font-display text-base font-semibold tracking-[0.28em] text-primary uppercase sm:text-lg"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease }}
          >
            {siteConfig.name}
          </motion.p>

          <motion.h1
            className="mt-6 font-display text-[2.4rem] font-semibold leading-[1.05] tracking-tight text-foreground text-balance sm:text-5xl md:text-6xl lg:text-[4.35rem]"
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05, ease }}
          >
            Des compétences qui vous font{" "}
            <span className="bg-gradient-to-r from-primary via-[#2563eb] to-[#3b82f6] bg-clip-text text-transparent">
              embaucher
            </span>
          </motion.h1>

          <motion.p
            className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg"
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease }}
          >
            Parcours premium pour bâtir des apps IA et SaaS — de l&apos;idée au déploiement.
          </motion.p>

          <motion.div
            className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center"
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.16, ease }}
          >
            <Button asChild size="xl" className="h-12 rounded-xl px-8 shadow-primary">
              <Link to="/courses">
                Commencer
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="xl" variant="outline" className="h-12 rounded-xl border-border/80 bg-card/70 px-7 backdrop-blur">
              <Link to="/courses">
                <Play className="h-4 w-4 text-primary" />
                Voir les cours
              </Link>
            </Button>
          </motion.div>
        </div>

        <motion.div
          className="mx-auto mt-16 flex max-w-xl flex-col items-center gap-5 md:mt-20"
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.22, ease }}
        >
          <div className="flex items-center -space-x-2">
            {tools.map((tool) => (
              <img
                key={tool.name}
                src={tool.logo}
                alt={tool.name}
                title={tool.name}
                className="size-10 rounded-full border-2 border-background bg-card object-contain p-1.5 shadow-sm md:size-11"
                loading="lazy"
              />
            ))}
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-0.5 text-brand-accent" aria-label="5 étoiles">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star key={index} className="h-3.5 w-3.5 fill-current" />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Utilisé par <span className="font-semibold text-foreground">{studentLabel}+</span> étudiants
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
