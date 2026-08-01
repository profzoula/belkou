import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { Calendar, Rocket, ShieldCheck, Zap } from "lucide-react";
import { formatCount } from "@/lib/courses";

type HeroProps = {
  studentCount: number;
};

const ease = [0.22, 1, 0.36, 1] as const;

export function Hero({ studentCount }: HeroProps) {
  const reduceMotion = useReducedMotion();
  const studentLabel = formatCount(studentCount);

  return (
    <section className="relative bg-background site-page-top">
      <div className="site-container py-4 sm:py-8 md:py-12">
        <motion.div
          className="relative overflow-hidden rounded-[1.35rem] bg-[#0046d5] shadow-[0_20px_60px_-28px_rgb(0_70_213_/_0.5)] sm:rounded-[1.75rem] md:rounded-[2rem]"
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
        >
          <img
            src="/images/website/pexels-ron-lach-9829316.jpg"
            alt="Diplômée BelKou prête pour sa carrière"
            className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover object-[72%_center] sm:object-[75%_center] lg:object-[78%_center]"
            width={1200}
            height={800}
            fetchPriority="high"
          />

          {/* Blue melt from left into the photo */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[1] hidden sm:block"
            style={{
              background:
                "linear-gradient(90deg, #002a8f 0%, #0039c4 28%, #0046d5 42%, rgba(0,70,213,0.82) 54%, rgba(0,70,213,0.4) 66%, rgba(0,70,213,0.12) 78%, transparent 92%)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[1] sm:hidden"
            style={{
              background:
                "linear-gradient(105deg, #002a8f 0%, #0046d5 45%, rgba(0,70,213,0.7) 58%, rgba(0,70,213,0.25) 75%, transparent 100%)",
            }}
          />

          <div className="relative z-10 px-5 py-5 sm:px-10 sm:py-12 md:px-12 xl:px-14">
            <div className="flex min-h-[15rem] flex-col justify-center sm:min-h-[28rem] lg:min-h-[32rem]">
              <div className="w-[58%] max-w-[16rem] sm:w-full sm:max-w-lg lg:max-w-[32rem]">
                <motion.h1
                  className="font-display text-[1.3rem] font-bold leading-[1.15] tracking-tight text-white sm:text-4xl sm:font-semibold md:text-5xl lg:text-[3rem]"
                  initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.05, ease }}
                >
                  Prêt à coder&nbsp;?
                  <span className="mt-1 block">
                    Des compétences qui vous font embaucher.
                  </span>
                </motion.h1>

                <motion.ul
                  className="mt-2.5 space-y-1 text-[10px] leading-snug text-white/90 sm:mt-6 sm:space-y-2.5 sm:text-[15px]"
                  initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1, ease }}
                >
                  <li className="flex items-center gap-1.5 sm:gap-2.5">
                    <Zap className="size-3 shrink-0 text-brand-accent sm:size-4" aria-hidden />
                    <span className="sm:hidden">Parcours premium IA &amp; SaaS</span>
                    <span className="hidden sm:inline">
                      Parcours premium IA &amp; SaaS, prêts à l&apos;emploi
                    </span>
                  </li>
                  <li className="flex items-center gap-1.5 sm:gap-2.5">
                    <ShieldCheck className="size-3 shrink-0 text-brand-accent sm:size-4" aria-hidden />
                    <span className="sm:hidden">Mentors • {studentLabel}+ étudiants</span>
                    <span className="hidden sm:inline">
                      Mentors experts • Projets réels • {studentLabel}+ étudiants
                    </span>
                  </li>
                </motion.ul>
              </div>

              <motion.div
                className="mt-3.5 flex w-full max-w-[20rem] flex-nowrap items-center gap-2 sm:mt-8 sm:max-w-none sm:gap-3"
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.16, ease }}
              >
                <Link
                  to="/courses"
                  className="inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-full bg-white px-3 text-[11px] font-semibold whitespace-nowrap text-[#0046d5] shadow-sm transition hover:bg-white/95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:h-12 sm:gap-2 sm:px-7 sm:text-sm"
                >
                  <Rocket className="size-3 sm:size-4" aria-hidden />
                  Commencer
                </Link>
                <Link
                  to="/courses"
                  className="inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-full border border-white/80 bg-transparent px-3 text-[11px] font-semibold whitespace-nowrap text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:h-12 sm:gap-2 sm:px-7 sm:text-sm"
                >
                  <Calendar className="size-3 sm:size-4" aria-hidden />
                  Voir les cours
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
