import { formatCount } from "@/lib/courses";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

type ImpactStatsProps = {
  studentCount: number;
  courseCount: number;
  overlap?: boolean;
};

type ImpactMetric = {
  value: string;
  label: string;
};

function buildMetrics(studentCount: number, courseCount: number): ImpactMetric[] {
  return [
    {
      value: `${formatCount(studentCount)}+`,
      label: "Apprenants formés sur BelKou depuis notre lancement",
    },
    {
      value: String(courseCount),
      label: "Cours au catalogue BelKou",
    },
    {
      value: siteConfig.stats.tools,
      label: "Outils et stacks IA enseignés",
    },
    {
      value: String(siteConfig.impact.countries),
      label: "Pays où nos étudiants apprennent",
    },
    {
      value: `${siteConfig.stats.rating}/5`,
      label: "Note moyenne de satisfaction des apprenants",
    },
  ];
}

export function ImpactStats({ studentCount, courseCount, overlap = false }: ImpactStatsProps) {
  const metrics = buildMetrics(studentCount, courseCount);
  const asOfLabel = siteConfig.impact.asOfLabel;

  return (
    <section
      aria-label="Impact BelKou"
      className={cn(
        overlap
          ? "relative z-20 -mt-14 mb-6 sm:-mt-[4.5rem] md:-mt-24 md:mb-8"
          : "site-section-anchor pb-10 pt-2 md:pb-14 md:pt-0",
      )}
    >
      <div className="site-container">
        <div
          className={cn(
            "rounded-3xl border border-border/60 bg-card px-4 py-7 sm:px-6 md:px-10 md:py-9",
            overlap
              ? "shadow-[0_22px_60px_-18px_rgba(15,23,42,0.18)]"
              : "shadow-sm",
          )}
        >
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5 lg:gap-0">
            {metrics.map((metric, index) => (
              <div
                key={metric.label}
                className={`flex flex-col items-center text-center lg:px-4 ${
                  index > 0 ? "lg:border-l lg:border-border/60" : ""
                }`}
              >
                <p className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-[2rem]">
                  {metric.value}
                </p>
                <p className="mt-2 max-w-[12rem] text-sm leading-snug text-muted-foreground">{metric.label}</p>
              </div>
            ))}
          </div>

          {asOfLabel ? (
            <p className="mt-8 text-center text-xs text-muted-foreground">{asOfLabel}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
