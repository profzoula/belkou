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
    { icon: Wrench, value: siteConfig.stats.tools, label: "Outils IA & frameworks" },
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
        "flex min-w-[9.5rem] items-center gap-3 rounded-2xl border border-border/70 bg-card/95 px-3.5 py-3 shadow-[0_14px_40px_rgb(15_23_42_/_0.08)] backdrop-blur-sm sm:min-w-[10.5rem] sm:px-4",
        className,
      )}
    >
      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-[1.125rem]" strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className="font-display text-lg font-bold leading-none tracking-tight text-foreground">
          {value}
        </p>
        <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{label}</p>
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

      <div className="site-container relative grid items-center gap-8 px-4 pb-8 pt-6 sm:gap-10 sm:pb-10 sm:pt-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-12 xl:gap-16">
        <motion.div
          className="flex min-w-0 flex-col items-start text-left"
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary sm:text-xs">
            Formations premium · IA &amp; SaaS
          </p>

          <h1 className="mt-4 max-w-xl font-display text-[1.65rem] font-bold leading-[1.08] tracking-tight text-foreground text-balance sm:text-4xl md:text-[2.75rem] lg:text-5xl">
            Apprenez. Appliquez.
            <br />
            <span className="text-primary">Lancez vos apps IA &amp; SaaS.</span>
          </h1>

          <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base md:text-lg">
            Accédez à des parcours structurés en français — de l&apos;idée au déploiement, avec
            mentors, projets concrets et une communauté active.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3 sm:mt-8 sm:gap-4">
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

          <div className="mt-8 flex flex-wrap items-center gap-3 sm:mt-10">
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

        <motion.div
          className="relative mx-auto w-full max-w-[min(100%,28rem)] lg:min-h-[34rem] lg:max-w-none lg:justify-self-end"
          initial={reduceMotion ? false : { opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, delay: 0.08, ease }}
        >
          <div
            aria-hidden
            className="absolute inset-x-6 bottom-2 h-24 rounded-[100%] bg-primary/15 blur-3xl sm:inset-x-10 sm:bottom-4 sm:h-32"
          />

          <HeroSquiggle className="absolute left-2 top-[18%] z-20 hidden w-24 sm:block lg:left-4 lg:w-28" />

          <div className="relative z-10 flex justify-center lg:justify-end">
            <img
              src="/about/Mackenson.png"
              alt={`${siteConfig.founder.name} — fondateur BelKou`}
              className="h-auto w-full max-w-[18rem] object-contain object-bottom drop-shadow-[0_24px_50px_rgb(2_8_23_/_0.18)] sm:max-w-[22rem] md:max-w-[26rem] lg:max-h-[min(72vh,640px)] lg:max-w-none lg:w-[88%]"
              width={900}
              height={1200}
              fetchPriority="high"
              decoding="async"
            />
          </div>

          <div className="pointer-events-none absolute inset-0 hidden lg:block">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                className={cn(
                  "absolute",
                  index === 0 && "right-0 top-[12%]",
                  index === 1 && "-right-2 top-[44%]",
                  index === 2 && "right-4 bottom-[14%]",
                )}
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.2 + index * 0.08, ease }}
              >
                <HeroStatCard icon={stat.icon} value={stat.value} label={stat.label} />
              </motion.div>
            ))}
          </div>

          <Sparkles
            aria-hidden
            className="absolute bottom-[8%] right-0 hidden size-7 text-foreground/75 lg:block"
            strokeWidth={1.75}
          />

          <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3 lg:hidden">
            {stats.map((stat) => (
              <HeroStatCard key={stat.label} icon={stat.icon} value={stat.value} label={stat.label} />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
