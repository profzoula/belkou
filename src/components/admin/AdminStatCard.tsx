import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type AdminStatCardProps = {
  label: string;
  value: number | string;
  icon: LucideIcon;
  onManage?: () => void;
  highlight?: boolean;
  manageLabel?: string;
};

export function AdminStatCard({
  label,
  value,
  icon: Icon,
  onManage,
  highlight,
  manageLabel = "Gérer →",
}: AdminStatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md",
        highlight ? "border-amber-400/80 ring-1 ring-amber-400/30" : "border-border/70",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 font-display text-3xl font-bold tracking-tight">{value}</p>
      {onManage && (
        <button
          type="button"
          onClick={onManage}
          className="mt-4 text-sm font-medium text-primary hover:underline"
        >
          {manageLabel}
        </button>
      )}
    </div>
  );
}
