import { Check, Clock, Target } from "lucide-react";
import { SectionHeader } from "@/components/site/SectionHeader";
import { siteConfig } from "@/lib/site-config";

export function FormationObjectives() {
  const { formation } = siteConfig;

  return (
    <section id="objectifs" className="section-divider section-alt py-16 sm:py-20 md:py-28">
      <div className="site-container">
        <SectionHeader
          label="Objectifs"
          title="Objectif de la formation"
          description="À la fin du programme, vous serez capable de lancer et déployer vos propres projets avec l'IA."
          className="max-w-xl"
        />

        <div className="grid md:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
          <div className="surface rounded-2xl p-5 sm:p-6 border border-border">
            <div className="flex items-center gap-3 mb-5">
              <div className="icon-box">
                <Target className="h-4 w-4" />
              </div>
              <h3 className="text-base font-semibold">Après la formation, vous saurez</h3>
            </div>
            <ul className="space-y-3">
              {formation.objectives.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-foreground/90 leading-snug">
                  <Check className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="surface rounded-2xl p-5 sm:p-6 border border-border">
            <div className="flex items-center gap-3 mb-5">
              <div className="icon-box">
                <Clock className="h-4 w-4" />
              </div>
              <h3 className="text-base font-semibold">Durée de la formation</h3>
            </div>
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-medium text-foreground mb-1">Option recommandée</p>
                <p className="text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">{formation.durationRecommended}</strong>
                  {" "}— {formation.schedule}
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Format intensif</p>
                <p className="text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">{formation.durationIntensive}</strong>
                </p>
              </div>
              <div className="rounded-xl bg-primary/5 border border-primary/15 px-4 py-3">
                <p className="font-medium text-foreground mb-0.5">Chaque session</p>
                <p className="text-muted-foreground">{formation.sessionLength}</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Accès à vie au contenu après la cohorte. Début : {siteConfig.cohortStartDate}.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
