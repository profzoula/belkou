import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Play, Sparkles, Star, Users, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCount } from "@/lib/courses";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

type HeroProps = {
  studentCount: number;
};

const ease = [0.22, 1, 0.36, 1] as const;

const avatarBase = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/testimonial-avatars`;
const heroAvatars = [
  `${avatarBase}/junior-pierre.jpg`,
  `${avatarBase}/marie-claire-desir.jpg`,
  `${avatarBase}/wislande-joseph.jpg`,
  `${avatarBase}/mackenson-etienne.jpg`,
];

const heroStats = (studentLabel: string) =>
  [
    { icon: Wrench, value: siteConfig.stats.tools, label: "Outils & ressources" },
    { icon: Star, value: siteConfig.stats.rating, label: "Note moyenne" },
    { icon: Users, value: `${studentLabel}+`, label: "Étudiants actifs" },
  ] as const;

function HeroStatCard({
  icon: Icon,
  value,
  label,
  className,
}: {
  icon: typeof Wrench;
  value: string;
  label: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex w-[8.75rem] items-center gap-2 rounded-2xl border border-border/50 bg-white px-2.5 py-2 shadow-[0_18px_44px_rgb(15_23_42_/_0.14)] dark:border-border/70 dark:bg-card sm:w-[10.25rem] sm:gap-2.5 sm:px-3.5 sm:py-2.5 md:w-[10.75rem] md:py-3",
        className,
      )}
    >
      <div className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary sm:size-9">
        <Icon className="size-3.5 sm:size-4" strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className="font-display text-sm font-bold leading-none tracking-tight text-foreground sm:text-base md:text-lg">
          {value}
        </p>
        <p className="mt-1 text-[9px] leading-snug text-muted-foreground sm:text-[10px] md:text-[11px]">{label}</p>
      </div>
    </div>
  );
}

function HeroSquiggle({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 120 48"
      className={cn("pointer-events-none text-foreground/80", className)}
      fill="none"
    >
      <path
        d="M4 28 C 28 8, 52 40, 76 18 S 108 34, 116 12"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Hero({ studentCount }: HeroProps) {
  const reduceMotion = useReducedMotion();
  const studentLabel = formatCount(studentCount);
  const stats = heroStats(studentLabel);

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

      <div className="site-container relative grid items-start gap-6 px-4 pb-0 pt-6 sm:gap-8 sm:pt-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-end lg:gap-8 xl:gap-10">
        {/* `contents` on mobile so CTA/social can order below the image */}
        <div className="contents lg:flex lg:min-h-[32rem] lg:flex-col lg:justify-center lg:pb-12 xl:min-h-[34rem]">
          <motion.div
            className="order-1 flex min-w-0 flex-col items-start text-left"
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary sm:text-xs">
              Formation en ligne
            </p>

            <h1 className="mt-4 max-w-xl font-display text-[1.65rem] font-bold leading-[1.08] tracking-tight text-foreground text-balance sm:text-4xl md:text-[2.75rem] lg:text-5xl">
              Apprenez. Appliquez.
              <br />
              <span className="text-primary">Progressez à votre rythme.</span>
            </h1>

            <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base md:text-lg">
              Accédez à une variété de cours en Creole — tech, business, création et plus — avec
              mentors, projets concrets et une communauté active.
            </p>
          </motion.div>

          <motion.div
            className="order-3 flex min-w-0 flex-col items-start pb-8 text-left sm:pb-10 lg:order-none lg:pb-0"
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.12, ease }}
          >
            <div className="mt-6 flex flex-wrap items-center gap-3 sm:mt-8 sm:gap-4 lg:mt-8">
              <Button
                asChild
                variant="hero"
                size="lg"
                className="h-12 rounded-xl px-6 text-sm sm:px-7"
              >
                <Link to="/courses">
                  Explorer les cours
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
              <Link
                to="/courses"
                className="inline-flex items-center gap-2.5 text-sm font-semibold text-primary transition-opacity hover:opacity-85"
              >
                <span className="grid size-10 place-items-center rounded-full border-2 border-primary/25 bg-card/80">
                  <Play className="size-4 fill-primary text-primary" aria-hidden />
                </span>
                Voir les cours
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3 sm:mt-8">
              <div className="flex -space-x-2.5">
                {heroAvatars.map((src, index) => (
                  <img
                    key={src}
                    src={src}
                    alt=""
                    width={36}
                    height={36}
                    className="size-9 rounded-full border-2 border-background object-cover ring-1 ring-border/60"
                    style={{ zIndex: heroAvatars.length - index }}
                    loading="lazy"
                    decoding="async"
                  />
                ))}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-0.5 text-brand-accent" aria-label="5 étoiles">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className="size-3.5 fill-current sm:size-4" />
                  ))}
                </div>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                  Rejoignez{" "}
                  <span className="font-semibold text-foreground">{studentLabel}+</span> étudiants
                  qui développent avec BelKou
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          className="relative order-2 mx-auto w-full lg:order-none lg:mx-0 lg:self-end"
          initial={reduceMotion ? false : { opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, delay: 0.08, ease }}
        >
          {/* Portrait sits flush on the bottom edge of the hero */}
          <div className="relative flex justify-center lg:justify-start">
            <div
              aria-hidden
              className="absolute bottom-0 left-1/2 h-24 w-[65%] -translate-x-1/2 rounded-[100%] bg-primary/20 blur-3xl lg:left-[32%] lg:translate-x-0"
            />

            <div className="relative isolate w-fit max-w-full pr-[7.5rem] sm:pr-[9rem] lg:pr-[9.75rem] xl:pr-[10.5rem]">
              <HeroSquiggle className="absolute -left-5 top-[18%] z-10 hidden w-20 sm:block lg:-left-8 lg:w-28" />

              <img
                src="/about/Mackenson.png"
                alt={`${siteConfig.founder.name} — fondateur BelKou`}
                className="relative z-[1] block h-auto max-h-[min(52vh,380px)] w-auto max-w-[min(100%,13.5rem)] object-contain object-bottom mix-blend-multiply dark:mix-blend-normal sm:max-h-[min(60vh,460px)] sm:max-w-[18rem] lg:max-h-[min(78vh,640px)] lg:max-w-[26rem] xl:max-w-[28rem]"
                width={900}
                height={1200}
                fetchPriority="high"
                decoding="async"
              />

              <div className="pointer-events-none absolute inset-y-0 right-0 z-20 flex w-[8.75rem] -translate-x-1 flex-col justify-center gap-3 sm:w-[10.25rem] sm:gap-3.5 sm:-translate-x-2 lg:w-[10.75rem] lg:gap-4 xl:w-[11.25rem]">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    className={cn(index === 1 && "translate-x-2 sm:translate-x-3")}
                    initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.2 + index * 0.08, ease }}
                  >
                    <HeroStatCard icon={stat.icon} value={stat.value} label={stat.label} />
                  </motion.div>
                ))}

                <Sparkles
                  aria-hidden
                  className="ml-auto size-5 text-foreground/80 sm:size-7"
                  strokeWidth={1.75}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
