import { Link } from "@tanstack/react-router";
import { ArrowRight, Star, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroTrustLogos } from "@/components/site/HeroTrustLogos";
import { formatCount } from "@/lib/courses";
import { siteConfig } from "@/lib/site-config";

type HeroProps = {
  studentCount: number;
  previewCourseSlug?: string;
};

const heroAvatars = [
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&auto=format&fit=crop&w=64&h=64",
  "https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200&auto=format&fit=crop&w=64&h=64",
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop&w=64&h=64",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop&w=64&h=64",
  "https://randomuser.me/api/portraits/men/75.jpg",
] as const;

export function Hero({ studentCount, previewCourseSlug }: HeroProps) {
  const studentLabel = formatCount(studentCount);

  return (
    <section className="relative overflow-hidden bg-background text-foreground site-page-top">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/4 top-24 -z-10 size-72 rounded-full bg-indigo-300/30 blur-[100px] sm:top-10 sm:size-96 xl:size-[30rem]"
      />

      <div className="site-container relative flex flex-col items-center px-4 pb-16 pt-8 text-center sm:pb-20 sm:pt-10">
        <div className="animate-fade-up mt-8 flex items-center sm:mt-12">
          <div className="flex -space-x-3 pr-3">
            {heroAvatars.map((src, index) => (
              <img
                key={src}
                src={src}
                alt=""
                width={32}
                height={32}
                className="size-8 rounded-full border-2 border-white object-cover transition-transform hover:-translate-y-0.5"
                style={{ zIndex: index + 1 }}
                loading="lazy"
              />
            ))}
          </div>
          <div className="text-left">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star key={index} className="size-4 fill-indigo-600 text-indigo-600" aria-hidden />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Utilisé par <span className="font-medium text-foreground">{studentLabel}+</span> étudiants
            </p>
          </div>
        </div>

        <h1 className="animate-fade-up [animation-delay:60ms] mt-4 max-w-5xl font-display text-4xl font-semibold leading-[1.1] tracking-tight text-balance sm:text-5xl md:text-6xl md:leading-[1.08]">
          Créez des apps rentables avec{" "}
          <span className="whitespace-nowrap bg-gradient-to-r from-indigo-700 to-indigo-500 bg-clip-text text-transparent">
            {siteConfig.name}
          </span>
        </h1>

        <p className="animate-fade-up [animation-delay:120ms] my-7 max-w-md text-base text-muted-foreground">
          Formations pratiques en IA, SaaS et déploiement — preview gratuite, paiement par cours, accès à vie.
        </p>

        <div className="animate-fade-up [animation-delay:180ms] flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
          <Button
            asChild
            size="lg"
            className="h-12 rounded-full bg-indigo-600 px-9 text-white shadow-sm ring-1 ring-indigo-400/40 hover:bg-indigo-700"
          >
            <Link to="/courses">
              Commencer
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          {previewCourseSlug ? (
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 rounded-full border-slate-300 px-7 text-slate-700 hover:bg-indigo-50 hover:text-slate-900"
            >
              <Link to="/courses/$slug" params={{ slug: previewCourseSlug }}>
                <Video className="h-5 w-5" />
                Voir une démo
              </Link>
            </Button>
          ) : (
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 rounded-full border-slate-300 px-7 text-slate-700 hover:bg-indigo-50 hover:text-slate-900"
            >
              <a href="#how-it-works">
                <Video className="h-5 w-5" />
                En savoir plus
              </a>
            </Button>
          )}
        </div>

        <p className="animate-fade-up [animation-delay:240ms] mt-14 py-2 text-sm text-muted-foreground">
          Ils nous font confiance, dont
        </p>

        <div className="animate-fade-up [animation-delay:300ms] w-full py-4">
          <HeroTrustLogos />
        </div>
      </div>
    </section>
  );
}
