import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  CircleDollarSign,
  Filter,
  Search,
  WalletCards,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { AdminSection } from "@/components/admin/AdminLayout";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import type { getAdminOverview } from "@/lib/fns/admin";
import { formatAffiliateUsd } from "@/lib/affiliate-config";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

type OverviewData = Awaited<ReturnType<typeof getAdminOverview>>;

type OverviewProps = {
  data: OverviewData;
  onNavigate: (section: AdminSection) => void;
};

function formatActivityDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatIncomeUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

function greetingLabel() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon après-midi";
  return "Bonsoir";
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

function shortId(id: string): string {
  return `#${id.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}

const statusMeta: Record<
  string,
  { label: string; dot: string; text: string }
> = {
  paid: {
    label: "Completed",
    dot: "bg-emerald-500",
    text: "text-foreground",
  },
  pending: {
    label: "Pending",
    dot: "bg-amber-400",
    text: "text-foreground",
  },
  manual_pending: {
    label: "In Progress",
    dot: "bg-orange-500",
    text: "text-foreground",
  },
};

export function AdminOverviewTab({ data, onNavigate }: OverviewProps) {
  const { finance, recentRegistrations, affiliate, stats } = data;
  const pending = stats.pending;
  const [query, setQuery] = useState("");
  const [planFilter, setPlanFilter] = useState<"all" | "premium" | "vip" | "live">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return recentRegistrations.filter((row) => {
      if (planFilter !== "all" && row.plan !== planFilter) return false;
      if (!q) return true;
      return (
        row.full_name.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q) ||
        row.id.toLowerCase().includes(q) ||
        row.plan.toLowerCase().includes(q)
      );
    });
  }, [planFilter, query, recentRegistrations]);

  const firstName = siteConfig.founder.name.split(" ")[0] ?? "Admin";

  return (
    <div className="space-y-7 sm:space-y-8">
      <div className="max-w-2xl">
        <h1 className="text-[1.75rem] font-bold tracking-[-0.03em] text-foreground sm:text-[2rem]">
          {greetingLabel()}, {firstName}
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
          Voici un aperçu des revenus d&apos;inscription, des commissions et de l&apos;activité
          récente.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
        <AdminStatCard
          label="Total Income"
          value={formatIncomeUsd(finance.totalIncomeUsd)}
          icon={CircleDollarSign}
          highlight
          delta={`${finance.paidRegistrations} payée${finance.paidRegistrations === 1 ? "" : "s"}`}
          hint={pending > 0 ? `${pending} inscription${pending === 1 ? "" : "s"} en attente` : "Inscriptions confirmées"}
          manageLabel="Voir"
          onManage={() => onNavigate("inscriptions")}
        />
        <AdminStatCard
          label="Commission"
          value={`$${formatAffiliateUsd(finance.totalCommissionUsd)}`}
          icon={WalletCards}
          delta={
            affiliate.affiliateCount > 0
              ? `${affiliate.affiliateCount} affilié${affiliate.affiliateCount === 1 ? "" : "s"}`
              : "0 affilié"
          }
          hint={
            affiliate.pendingWithdrawals > 0
              ? `${affiliate.pendingWithdrawals} retrait${affiliate.pendingWithdrawals === 1 ? "" : "s"} en attente`
              : "Total commissions étudiants"
          }
          manageLabel="Voir"
          onManage={() => onNavigate("commissions")}
        />
      </div>

      <section className="overflow-hidden rounded-[22px] bg-white shadow-[0_4px_24px_rgb(15_23_42_/_0.05)] dark:border dark:border-border dark:bg-card">
        <div className="flex flex-col gap-4 border-b border-[#eef0f3] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-border">
          <div>
            <h2 className="text-base font-semibold tracking-[-0.02em] text-foreground">
              Recent Activity
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Dernières inscriptions sur la plateforme.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="relative block min-w-0 sm:w-[220px]">
              <span className="sr-only">Rechercher</span>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                strokeWidth={1.75}
                aria-hidden
              />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search"
                className="h-10 rounded-xl border-[#e5e7eb] bg-[#f8f9fb] pl-9 text-sm shadow-none focus-visible:ring-1 dark:bg-muted/40"
              />
            </label>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Filter
                  className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <select
                  value={planFilter}
                  onChange={(event) =>
                    setPlanFilter(event.target.value as typeof planFilter)
                  }
                  className="h-10 cursor-pointer appearance-none rounded-xl border border-[#e5e7eb] bg-white py-2 pl-9 pr-8 text-sm font-medium text-foreground shadow-none outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-border dark:bg-card"
                  aria-label="Filtrer par plan"
                >
                  <option value="all">Filter</option>
                  <option value="premium">Premium</option>
                  <option value="vip">VIP</option>
                  <option value="live">Live</option>
                </select>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 rounded-xl border-[#e5e7eb] bg-white px-3 dark:border-border"
                onClick={() => onNavigate("inscriptions")}
              >
                Voir tout
                <ArrowUpRight className="size-3.5" strokeWidth={2} aria-hidden />
              </Button>
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-6 py-14 text-center text-sm text-muted-foreground">
            {recentRegistrations.length === 0
              ? "Aucune inscription pour le moment."
              : "Aucun résultat pour cette recherche."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
                  <th className="px-5 py-3.5 font-semibold sm:px-6">ID</th>
                  <th className="px-3 py-3.5 font-semibold">Activity</th>
                  <th className="px-3 py-3.5 font-semibold">Price</th>
                  <th className="px-3 py-3.5 font-semibold">Status</th>
                  <th className="px-5 py-3.5 font-semibold sm:px-6">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const status = statusMeta[row.payment_status] ?? statusMeta.pending!;
                  return (
                    <tr
                      key={row.id}
                      className="border-t border-[#f1f3f6] transition-colors hover:bg-[#fafbfc] dark:border-border/60 dark:hover:bg-muted/20"
                    >
                      <td className="px-5 py-4 font-mono text-xs text-muted-foreground sm:px-6">
                        {shortId(row.id)}
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-3">
                          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#eef2ff] text-[11px] font-bold text-primary dark:bg-primary/15">
                            {initials(row.full_name)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-medium tracking-[-0.01em] text-foreground">
                              {row.full_name}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {row.plan.toUpperCase()} · {row.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4 font-medium tabular-nums text-foreground">
                        {row.payment_status === "paid" && row.amount_usd > 0
                          ? formatIncomeUsd(row.amount_usd)
                          : "—"}
                      </td>
                      <td className="px-3 py-4">
                        <span
                          className={cn(
                            "inline-flex items-center gap-2 text-sm font-medium",
                            status.text,
                          )}
                        >
                          <span
                            className={cn("size-2 rounded-full", status.dot)}
                            aria-hidden
                          />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground sm:px-6">
                        {formatActivityDate(row.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
