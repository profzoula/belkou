import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type AdminStatCardProps = {
  label: string;
  value: number | string;
  icon: LucideIcon;
  onManage?: () => void;
  highlight?: boolean;
  manageLabel?: string;
  hint?: string;
};

export function AdminStatCard({
  label,
  value,
  icon: Icon,
  onManage,
  highlight,
  manageLabel = "Ouvrir",
  hint,
}: AdminStatCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-[20px] border bg-card p-5 shadow-[0_8px_24px_rgb(15_23_42_/_0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgb(15_23_42_/_0.08)]",
        highlight
          ? "border-brand-accent/60 ring-1 ring-brand-accent/30"
          : "border-border/80",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100"
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
          <p className="mt-2 font-display text-[28px] font-semibold tracking-tight tabular-nums leading-none">
            {value}
          </p>
          {hint ? <p className="mt-2 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        <div
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-2xl",
            highlight ? "bg-brand-accent/15 text-brand-accent-foreground" : "bg-primary/10 text-primary",
          )}
        >
          <Icon className="size-4" aria-hidden />
        </div>
      </div>
      {onManage ? (
        <button
          type="button"
          onClick={onManage}
          className="mt-4 inline-flex cursor-pointer items-center gap-1 text-sm font-semibold text-primary transition hover:gap-1.5"
        >
          {manageLabel}
          <ArrowUpRight className="size-3.5" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
