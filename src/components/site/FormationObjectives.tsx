import { Check, Clock, Sparkles, Target } from "lucide-react";
import { siteConfig } from "@/lib/site-config";

export function FormationObjectivesPanel() {
  const { formation } = siteConfig;

  return (
    <div id="objectifs" className="site-section-anchor relative min-w-0 w-full max-w-full overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-8 right-0 h-40 w-40 rounded-full bg-primary/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-6 left-0 h-32 w-32 rounded-full bg-primary/8 blur-3xl"
      />

      <div className="relative overflow-hidden rounded-3xl border border-primary/15 bg-card/90 shadow-lg backdrop-blur-sm">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
        />

        <div className="border-b border-border/60 bg-gradient-to-br from-primary/[0.06] via-card to-primary-soft/40 px-5 py-5 sm:px-6 sm:py-6">
          <p className="section-label mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            Objectifs
          </p>
          <h2 className="font-display text-xl sm:text-[1.65rem] font-bold text-balance leading-tight tracking-tight">
            Objectif de la formation
          </h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-md">
            À la fin du programme, vous serez capable de lancer et déployer vos propres projets avec l&apos;IA.
          </p>
        </div>

        <div className="space-y-3 p-4 sm:p-5">
          <div className="brand-feature surface-hover rounded-2xl p-4 sm:p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="icon-box shadow-primary">
                <Target className="h-4 w-4" />
              </div>
              <h3 className="min-w-0 flex-1 text-sm font-semibold tracking-tight">Après la formation, vous saurez</h3>
            </div>
            <ul className="space-y-1.5">
              {formation.objectives.map((item) => (
                <li
                  key={item}
                  className="flex min-w-0 items-start gap-2.5 rounded-xl px-2 py-2 text-sm text-foreground/90 leading-snug transition-colors hover:bg-primary/[0.04]"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/15">
                    <Check className="h-3 w-3 text-primary" strokeWidth={2.5} />
                  </span>
                  <span className="min-w-0 flex-1 break-words">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="surface surface-hover rounded-2xl p-4 sm:p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="icon-box">
                <Clock className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold tracking-tight">Durée de la formation</h3>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {formation.durationRecommended}
              </span>
              <span className="inline-flex items-center rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
                {formation.durationIntensive}
              </span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="rounded-xl border border-border/80 bg-muted/20 px-3.5 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  Option recommandée
                </p>
                <p className="text-foreground leading-relaxed">
                  <span className="font-display text-lg font-bold text-primary">{formation.durationRecommended.split(" ")[0]}</span>
                  <span className="font-semibold"> semaines</span>
                  <span className="text-muted-foreground"> — {formation.schedule}</span>
                </p>
              </div>

              <div className="rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/15 px-3.5 py-3">
                <p className="font-medium text-foreground mb-0.5">Chaque session</p>
                <p className="text-muted-foreground">{formation.sessionLength}</p>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed px-0.5">
                Accès à vie au contenu du cours acheté — progressez à votre rythme.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
