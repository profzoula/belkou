import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

type AdminStatCardProps = {
  label: string;
  value: number | string;
  icon: LucideIcon;
  onManage?: () => void;
  /** Solid accent fill — Finexy featured KPI */
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
        "group relative flex min-h-[168px] flex-col overflow-hidden rounded-[22px] p-6 transition-all duration-200 hover:-translate-y-0.5",
        highlight
          ? "bg-primary text-primary-foreground shadow-[0_18px_40px_rgb(0_70_213_/_0.28)]"
          : "bg-white shadow-[0_4px_24px_rgb(15_23_42_/_0.05)] dark:border dark:border-border dark:bg-card",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p
          className={cn(
            "text-[13px] font-medium tracking-[-0.01em]",
            highlight ? "text-primary-foreground/80" : "text-muted-foreground",
          )}
        >
          {label}
        </p>
        <div
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-[14px]",
            highlight
              ? "bg-white/15 text-primary-foreground"
              : "bg-[#f3f4f6] text-foreground dark:bg-muted",
          )}
        >
          <Icon className="size-[18px]" strokeWidth={1.75} aria-hidden />
        </div>
      </div>

      <p className="mt-5 font-sans text-[2rem] font-bold tracking-[-0.03em] tabular-nums leading-none sm:text-[2.25rem]">
        {value}
      </p>

      <div className="mt-auto flex items-end justify-between gap-3 pt-5">
        <div className="min-w-0 space-y-1">
          {delta ? (
            <p
              className={cn(
                "inline-flex items-center gap-1 text-xs font-semibold",
                highlight ? "text-primary-foreground" : "text-emerald-600 dark:text-emerald-400",
              )}
            >
              <TrendingUp className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
              <span className="truncate">{delta}</span>
            </p>
          ) : null}
          {hint ? (
            <p
              className={cn(
                "text-xs",
                highlight ? "text-primary-foreground/70" : "text-muted-foreground",
              )}
            >
              {hint}
            </p>
          ) : null}
        </div>
        {onManage ? (
          <button
            type="button"
            onClick={onManage}
            className={cn(
              "inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition",
              highlight
                ? "bg-white/15 text-primary-foreground hover:bg-white/25"
                : "bg-[#f3f4f6] text-foreground hover:bg-[#e8eaed] dark:bg-muted dark:hover:bg-muted/80",
            )}
          >
            {manageLabel}
            <ArrowUpRight className="size-3.5" strokeWidth={2} aria-hidden />
          </button>
        ) : null}
      </div>
    </div>
  );
}
