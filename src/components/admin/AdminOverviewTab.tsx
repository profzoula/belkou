import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  CircleDollarSign,
  Crown,
  Filter,
  GraduationCap,
  Search,
  WalletCards,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { AdminSection } from "@/components/admin/AdminLayout";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { OverviewBarChart } from "@/components/admin/charts/OverviewBarChart";
import { OverviewGauge } from "@/components/admin/charts/OverviewGauge";
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
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
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

const panelClass =
  "flex h-full min-h-0 flex-col overflow-hidden rounded-[22px] bg-white shadow-[0_4px_24px_rgb(15_23_42_/_0.05)] dark:border dark:border-border dark:bg-card";

export function AdminOverviewTab({ data, onNavigate }: OverviewProps) {
  const { finance, recentRegistrations, affiliate, stats, dailyIncome, purchasedCourses } =
    data;
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

  const chartData = useMemo(
    () =>
      (dailyIncome ?? []).map((row) => ({
        day: new Date(`${row.date}T12:00:00`).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        value: Math.round(row.value),
      })),
    [dailyIncome],
  );

  const firstName = siteConfig.founder.name.split(" ")[0] ?? "Admin";
  const gaugeValue =
    stats.total > 0 ? Math.round((stats.paid / stats.total) * 100) : 0;

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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <section className={cn(panelClass, "md:col-span-2 xl:col-span-4")}>
          <div className="flex items-start justify-between gap-3 px-5 pt-5 sm:px-6">
            <div>
              <h2 className="text-base font-semibold tracking-[-0.02em] text-foreground">
                Bar Chart - Interactive
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Revenus confirmés sur 90 jours
              </p>
            </div>
          </div>
          <div className="px-3 pb-4 sm:px-5">
            <OverviewBarChart data={chartData} />
          </div>
        </section>

        <AdminStatCard
          className="h-full"
          label="Total Income"
          value={formatIncomeUsd(finance.totalIncomeUsd)}
          icon={CircleDollarSign}
          highlight
          delta={`${finance.paidRegistrations} payée${finance.paidRegistrations === 1 ? "" : "s"}`}
          hint={
            pending > 0
              ? `${pending} inscription${pending === 1 ? "" : "s"} en attente`
              : "Inscriptions confirmées"
          }
          manageLabel="Voir"
          onManage={() => onNavigate("inscriptions")}
        />
        <AdminStatCard
          className="h-full"
          label="Total commissions"
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

        <section className={cn(panelClass, "min-h-[360px] md:col-span-2 xl:col-span-2 xl:row-span-2")}>
          <div className="px-5 pt-5 sm:px-6">
            <h2 className="text-base font-semibold tracking-[-0.02em] text-foreground">
              Gauge
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Taux de paiements confirmés
            </p>
          </div>
          <OverviewGauge
            centerValue={finance.totalIncomeUsd}
            defaultLabel="Revenu confirmé"
            formatOptions={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }}
            inactiveFillOpacity={0.4}
            spacing={25}
            value={gaugeValue}
          />
        </section>

        <AdminStatCard
          className="h-full"
          label="Nombre étudiants"
          value={stats.studentCount ?? stats.paid}
          icon={GraduationCap}
          delta={`${stats.paid} inscription${stats.paid === 1 ? "" : "s"} payée${stats.paid === 1 ? "" : "s"}`}
          hint="Comptes uniques avec un paiement"
          manageLabel="Voir"
          onManage={() => onNavigate("students")}
        />
        <AdminStatCard
          className="h-full"
          label="Nombre membres VIP"
          value={stats.vipMemberCount ?? stats.vip}
          icon={Crown}
          delta={`${stats.vip} inscription${stats.vip === 1 ? "" : "s"} VIP`}
          hint="Membres VIP uniques"
          manageLabel="Voir"
          onManage={() => onNavigate("vip")}
        />

        <section className={cn(panelClass, "md:col-span-2 xl:col-span-2")}>
          <div className="flex flex-col gap-3 border-b border-[#eef0f3] px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-border">
            <div>
              <h2 className="text-base font-semibold tracking-[-0.02em] text-foreground">
                Recent Activity
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Dernières inscriptions
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="relative hidden min-w-0 sm:block sm:w-[160px]">
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
                  className="h-9 rounded-xl border-[#e5e7eb] bg-[#f8f9fb] pl-9 text-sm shadow-none focus-visible:ring-1 dark:bg-muted/40"
                />
              </label>
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
                  className="h-9 cursor-pointer appearance-none rounded-xl border border-[#e5e7eb] bg-white py-1.5 pl-9 pr-8 text-sm font-medium text-foreground shadow-none outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-border dark:bg-card"
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
                className="h-9 rounded-xl border-[#e5e7eb] bg-white px-3 dark:border-border"
                onClick={() => onNavigate("inscriptions")}
              >
                Voir tout
                <ArrowUpRight className="size-3.5" strokeWidth={2} aria-hidden />
              </Button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-muted-foreground">
              {recentRegistrations.length === 0
                ? "Aucune inscription pour le moment."
                : "Aucun résultat pour cette recherche."}
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
                    <th className="px-5 py-3 font-semibold">Activity</th>
                    <th className="px-3 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 8).map((row) => {
                    const status = statusMeta[row.payment_status] ?? statusMeta.pending!;
                    return (
                      <tr
                        key={row.id}
                        className="border-t border-[#f1f3f6] transition-colors hover:bg-[#fafbfc] dark:border-border/60 dark:hover:bg-muted/20"
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#eef2ff] text-[10px] font-bold text-primary dark:bg-primary/15">
                              {initials(row.full_name)}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-medium tracking-[-0.01em] text-foreground">
                                {row.full_name}
                              </p>
                              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                {shortId(row.id)} · {row.plan.toUpperCase()}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
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
                        <td className="px-5 py-3 text-muted-foreground">
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

        <section className={cn(panelClass, "md:col-span-2 xl:col-span-2")}>
          <div className="flex items-center justify-between gap-3 border-b border-[#eef0f3] px-5 py-4 dark:border-border">
            <div>
              <h2 className="text-base font-semibold tracking-[-0.02em] text-foreground">
                Cours achetés
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Formations payées récemment
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 rounded-xl border-[#e5e7eb] bg-white px-3 dark:border-border"
              onClick={() => onNavigate("courses")}
            >
              Voir
              <ArrowUpRight className="size-3.5" strokeWidth={2} aria-hidden />
            </Button>
          </div>
          {(purchasedCourses ?? []).length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-muted-foreground">
              Aucun cours acheté pour le moment.
            </div>
          ) : (
            <ul className="divide-y divide-[#f1f3f6] dark:divide-border/60">
              {(purchasedCourses ?? []).map((course) => (
                <li
                  key={course.slug}
                  className="flex items-center justify-between gap-3 px-5 py-3.5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-[12px] bg-[#f3f4f6] text-foreground dark:bg-muted">
                      <BookOpen className="size-4" strokeWidth={1.75} aria-hidden />
                    </span>
                    <p className="truncate font-medium text-foreground">{course.title}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold tabular-nums text-foreground">
                      {course.count}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatIncomeUsd(course.revenueUsd)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
