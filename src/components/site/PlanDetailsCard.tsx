import { Check } from "lucide-react";
import { getPlanDetail, type PlanId } from "@/lib/plans";

type PlanDetailsCardProps = {
  planId: PlanId | string;
  className?: string;
};

export function PlanDetailsCard({ planId, className = "" }: PlanDetailsCardProps) {
  const plan = getPlanDetail(planId);
  const highlighted = plan.highlight;

  return (
    <aside
      className={`rounded-2xl p-5 sm:p-6 transition-all ${
        highlighted
          ? "bg-foreground text-background shadow-lg ring-2 ring-primary"
          : "surface ring-2 ring-primary/20"
      } ${className}`}
    >
      {plan.badge && (
        <div
          className={`inline-flex rounded-full px-3 py-0.5 text-[11px] font-semibold mb-4 ${
            highlighted
              ? "bg-secondary text-secondary-foreground"
              : "bg-primary text-primary-foreground"
          }`}
        >
          {plan.badge}
        </div>
      )}

      <p
        className={`text-[11px] font-semibold uppercase tracking-wide mb-2 ${
          highlighted ? "text-background/60" : "text-primary"
        }`}
      >
        Plan sélectionné
      </p>
      <h2 className="text-xl font-semibold">{plan.name}</h2>
      <p className={`text-sm mt-2 leading-relaxed ${highlighted ? "text-background/70" : "text-muted-foreground"}`}>
        {plan.desc}
      </p>

      <div className={`mt-5 pt-5 border-t ${highlighted ? "border-background/15" : "border-border"}`}>
        <span className="text-3xl font-semibold tracking-tight">${plan.price}</span>
        <span className={`ml-1.5 text-sm ${highlighted ? "text-background/60" : "text-muted-foreground"}`}>
          USD
        </span>
      </div>

      <ul className="mt-5 space-y-2.5">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm leading-snug">
            <Check
              className={`h-4 w-4 shrink-0 mt-0.5 ${highlighted ? "text-primary-foreground" : "text-primary"}`}
            />
            <span className={highlighted ? "text-background/90" : "text-foreground/85"}>{feature}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
