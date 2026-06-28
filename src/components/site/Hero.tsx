import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCount } from "@/lib/courses";
import { toolLogos } from "@/lib/tool-logos";

type HeroProps = {
  studentCount: number;
};

const heroAvatarClasses = ["z-[1]", "z-[2]", "z-[3]", "z-[4]", "z-[5]"] as const;

const heroAvatarLogos = toolLogos.slice(0, 5);

const heroNetworkLogos = [
  toolLogos[0],
  toolLogos[6],
  toolLogos[3],
  toolLogos[7],
  toolLogos[5],
] as const;

const networkPositions = [
  { x: 50, y: 48 },
  { x: 18, y: 22 },
  { x: 82, y: 18 },
  { x: 24, y: 78 },
  { x: 78, y: 82 },
] as const;

const networkNodes = [
  { className: "left-1/2 top-[48%]", size: "lg" as const },
  { className: "left-[18%] top-[22%]", size: "md" as const },
  { className: "left-[82%] top-[18%]", size: "md" as const },
  { className: "left-[24%] top-[78%]", size: "md" as const },
  { className: "left-[78%] top-[82%]", size: "md" as const },
] as const;

const networkLinks = [
  [0, 1],
  [0, 2],
  [0, 3],
  [0, 4],
  [1, 3],
  [2, 4],
] as const;

function GoldStar() {
  return (
    <svg width="13" height="12" viewBox="0 0 13 12" fill="none" aria-hidden className="shrink-0">
      <path
        d="M5.85536 0.463527C6.00504 0.00287118 6.65674 0.00287028 6.80642 0.463526L7.82681 3.60397C7.89375 3.80998 8.08572 3.94946 8.30234 3.94946H11.6044C12.0888 3.94946 12.2901 4.56926 11.8983 4.85397L9.22687 6.79486C9.05162 6.92219 8.97829 7.14787 9.04523 7.35388L10.0656 10.4943C10.2153 10.955 9.68806 11.338 9.2962 11.0533L6.62478 9.11244C6.44954 8.98512 6.21224 8.98512 6.037 9.11244L3.36558 11.0533C2.97372 11.338 2.44648 10.955 2.59616 10.4943L3.61655 7.35388C3.68349 7.14787 3.61016 6.92219 3.43491 6.79486L0.763497 4.85397C0.37164 4.56927 0.573027 3.94946 1.05739 3.94946H4.35944C4.57606 3.94946 4.76803 3.80998 4.83497 3.60397L5.85536 0.463527Z"
        fill="#FF8F20"
      />
    </svg>
  );
}

function HeroLogoBubble({
  name,
  logo,
  size = "sm",
}: {
  name: string;
  logo: string;
  size?: "sm" | "md" | "lg";
}) {
  const shellClass =
    size === "lg"
      ? "size-20 sm:size-24"
      : size === "md"
        ? "size-14 sm:size-16"
        : "size-10";
  const imageClass =
    size === "lg" ? "size-10 sm:size-12" : size === "md" ? "size-7 sm:size-8" : "size-5";

  return (
    <div
      title={name}
      className={`grid ${shellClass} place-items-center rounded-full border-2 border-white bg-white shadow-sm`}
    >
      <img src={logo} alt={name} className={`${imageClass} object-contain`} loading="lazy" />
    </div>
  );
}

function HeroLogoNetwork() {
  return (
    <div className="relative mx-auto aspect-[4/3] w-full max-w-md md:max-w-none">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        {networkLinks.map(([from, to]) => {
          const start = networkPositions[from];
          const end = networkPositions[to];
          return (
            <line
              key={`${from}-${to}`}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke="#CBD5E1"
              strokeWidth="0.35"
              strokeDasharray="2 2"
            />
          );
        })}
      </svg>

      {heroNetworkLogos.map((tool, index) => {
        const node = networkNodes[index];
        return (
          <div
            key={tool.name}
            className={`absolute -translate-x-1/2 -translate-y-1/2 ${node.className}`}
          >
            <HeroLogoBubble name={tool.name} logo={tool.logo} size={node.size} />
          </div>
        );
      })}
    </div>
  );
}

export function Hero({ studentCount }: HeroProps) {
  const studentLabel = formatCount(studentCount);

  return (
    <section className="relative overflow-hidden bg-[url('/hero/bg-with-grid.png')] bg-cover bg-center bg-no-repeat text-slate-800 site-page-top pb-28 md:pb-36 lg:pb-40">
      <div className="site-container relative flex flex-col-reverse gap-10 px-4 pb-8 pt-8 md:mt-16 md:flex-row md:items-center md:gap-12 md:pb-12 md:pt-10 lg:gap-16">
        <div className="min-w-0 flex-1 max-md:text-center">
          <h1 className="animate-fade-up max-w-xl font-display text-4xl font-semibold leading-[1.12] tracking-tight text-balance md:text-5xl md:leading-[1.08] lg:text-6xl lg:leading-[76px]">
            <span className="bg-gradient-to-r from-slate-900 to-[#6D8FE4] bg-clip-text text-transparent">
              Des compétences qui vous font embaucher
            </span>
          </h1>

          <p className="animate-fade-up [animation-delay:60ms] mt-6 max-w-lg text-sm leading-relaxed text-slate-600 md:text-base max-md:mx-auto">
            Rejoignez un parcours d&apos;apprentissage personnalisé pour devenir un pro du tech — apps IA, SaaS,
            déploiement et monétisation.
          </p>

          <div className="animate-fade-up [animation-delay:120ms] mt-6 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center max-md:justify-center">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-md bg-indigo-600 px-8 text-white hover:bg-indigo-700 active:scale-[0.98]"
            >
              <Link to="/courses">Commencer</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 rounded-md border-indigo-400 bg-white px-5 text-indigo-600 hover:bg-indigo-600/5 active:scale-[0.98]"
            >
              <Link to="/courses">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                Nos cours
              </Link>
            </Button>
          </div>

          <div className="animate-fade-up [animation-delay:180ms] mt-9 flex items-center max-md:justify-center">
            <div className="flex -space-x-3.5 pr-3">
              {heroAvatarLogos.map((tool, index) => (
                <div key={tool.name} className={heroAvatarClasses[index]}>
                  <HeroLogoBubble name={tool.name} logo={tool.logo} size="sm" />
                </div>
              ))}
            </div>
            <div className="text-left">
              <div className="flex items-center gap-px">
                {Array.from({ length: 5 }).map((_, index) => (
                  <GoldStar key={index} />
                ))}
              </div>
              <p className="text-sm text-slate-500">
                Utilisé par <span className="font-medium text-slate-700">{studentLabel}+</span> étudiants
              </p>
            </div>
          </div>
        </div>

        <div className="animate-fade-up [animation-delay:100ms] w-full md:max-w-xs lg:max-w-lg md:shrink-0">
          <HeroLogoNetwork />
        </div>
      </div>
    </section>
  );
}