import { DollarSign, Wallet } from "lucide-react";
import { PaymentStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import type { AdminSection } from "@/components/admin/AdminLayout";
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
    return new Date(iso).toLocaleString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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

export function AdminOverviewTab({ data, onNavigate }: OverviewProps) {
  const { finance, recentRegistrations, affiliate, stats } = data;
  const pending = stats.pending;

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">BelKou · opérations</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-[1.85rem]">
            {greetingLabel()}, {siteConfig.founder.name.split(" ")[0]}
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
            Revenus d&apos;inscription, commissions affiliés et activité récente.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <AdminStatCard
          label="Total Income"
          value={formatIncomeUsd(finance.totalIncomeUsd)}
          icon={DollarSign}
          highlight
          delta={`${finance.paidRegistrations} inscription${finance.paidRegistrations === 1 ? "" : "s"} payée${finance.paidRegistrations === 1 ? "" : "s"}`}
          hint={pending > 0 ? `${pending} en attente` : undefined}
          manageLabel="Inscriptions"
          onManage={() => onNavigate("inscriptions")}
        />
        <AdminStatCard
          label="Commission"
          value={`$${formatAffiliateUsd(finance.totalCommissionUsd)}`}
          icon={Wallet}
          delta={
            affiliate.affiliateCount > 0
              ? `${affiliate.affiliateCount} affilié${affiliate.affiliateCount === 1 ? "" : "s"}`
              : undefined
          }
          hint={
            affiliate.pendingWithdrawals > 0
              ? `${affiliate.pendingWithdrawals} retrait${affiliate.pendingWithdrawals === 1 ? "" : "s"} en attente`
              : "Total commissions étudiants"
          }
          manageLabel="Revenus"
          onManage={() => onNavigate("commissions")}
        />
      </div>

      <section className="overflow-hidden rounded-[24px] border border-black/5 bg-white shadow-[0_8px_24px_rgb(15_23_42_/_0.04)] dark:border-border dark:bg-card">
        <div className="flex flex-col gap-3 border-b border-black/5 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-border">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight">Recent Activity</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Dernières inscriptions sur la plateforme.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("inscriptions")}
            className="cursor-pointer text-sm font-semibold text-primary hover:underline"
          >
            Voir tout →
          </button>
        </div>

        {recentRegistrations.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">
            Aucune inscription pour le moment.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-black/5 bg-[#f8fafc] text-xs font-semibold tracking-wide text-muted-foreground uppercase dark:border-border dark:bg-muted/30">
                  <th className="px-5 py-3 font-semibold sm:px-6">Étudiant</th>
                  <th className="px-3 py-3 font-semibold">Plan</th>
                  <th className="px-3 py-3 font-semibold">Montant</th>
                  <th className="px-3 py-3 font-semibold">Statut</th>
                  <th className="px-5 py-3 font-semibold sm:px-6">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-border">
                {recentRegistrations.map((row) => (
                  <tr
                    key={row.id}
                    className="transition-colors hover:bg-[#f8fafc] dark:hover:bg-muted/20"
                  >
                    <td className="px-5 py-4 sm:px-6">
                      <p className="font-medium text-foreground">{row.full_name}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{row.email}</p>
                    </td>
                    <td className="px-3 py-4">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
                          row.plan === "vip"
                            ? "bg-brand-accent/20 text-brand-accent-foreground"
                            : "bg-[#eef2ff] text-primary dark:bg-primary/15",
                        )}
                      >
                        {row.plan}
                      </span>
                    </td>
                    <td className="px-3 py-4 tabular-nums text-muted-foreground">
                      {row.payment_status === "paid" && row.amount_usd > 0
                        ? formatIncomeUsd(row.amount_usd)
                        : "—"}
                    </td>
                    <td className="px-3 py-4">
                      <PaymentStatusBadge status={row.payment_status} className="text-[10px]" />
                    </td>
                    <td className="px-5 py-4 text-muted-foreground sm:px-6">
                      {formatActivityDate(row.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
