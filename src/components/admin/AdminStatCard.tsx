import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type AdminStatCardProps = {
  label: string;
  value: number | string;
  icon: LucideIcon;
  onManage?: () => void;
  /** Solid primary fill — Finexy-style featured KPI */
  highlight?: boolean;
  manageLabel?: string;
  hint?: string;
  delta?: string;
};

export function AdminStatCard({
  label,
  value,
  icon: Icon,
  onManage,
  highlight,
  manageLabel = "Ouvrir",
  hint,
  delta,
}: AdminStatCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-[22px] p-5 transition-all duration-200 hover:-translate-y-0.5",
        highlight
          ? "bg-primary text-primary-foreground shadow-[0_16px_36px_rgb(0_70_213_/_0.28)]"
          : "border border-black/5 bg-white shadow-[0_8px_24px_rgb(15_23_42_/_0.04)] dark:border-border dark:bg-card",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={cn(
              "text-xs font-medium",
              highlight ? "text-primary-foreground/75" : "text-muted-foreground",
            )}
          >
            {label}
          </p>
          <p className="mt-2 font-display text-[1.75rem] font-semibold tracking-tight tabular-nums leading-none">
            {value}
          </p>
          {delta ? (
            <p
              className={cn(
                "mt-2 text-xs font-semibold",
                highlight ? "text-brand-accent" : "text-success",
              )}
            >
              {delta}
            </p>
          ) : null}
          {hint ? (
            <p
              className={cn(
                "mt-2 text-xs",
                highlight ? "text-primary-foreground/70" : "text-muted-foreground",
              )}
            >
              {hint}
            </p>
          ) : null}
        </div>
        <div
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-2xl",
            highlight
              ? "bg-white/15 text-primary-foreground"
              : "bg-[#eef2ff] text-primary dark:bg-primary/15",
          )}
        >
          <Icon className="size-4" aria-hidden />
        </div>
      </div>
      {onManage ? (
        <button
          type="button"
          onClick={onManage}
          className={cn(
            "mt-4 inline-flex cursor-pointer items-center gap-1 text-sm font-semibold transition hover:gap-1.5",
            highlight ? "text-primary-foreground" : "text-primary",
          )}
        >
          {manageLabel}
          <ArrowUpRight className="size-3.5" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
