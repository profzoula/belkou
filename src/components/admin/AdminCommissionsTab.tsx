import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { DollarSign, RefreshCw, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { adminProcessWithdrawal, getAdminAffiliateOverview } from "@/lib/fns/admin";
import {
  AFFILIATE_COMMISSION_USD,
  AFFILIATE_MIN_WITHDRAWAL_USD,
  AFFILIATE_SIGNUP_COMMISSION_USD,
  formatAffiliateUsd,
} from "@/lib/affiliate-config";

type Overview = Awaited<ReturnType<typeof getAdminAffiliateOverview>>;

const withdrawalStatusLabel: Record<string, string> = {
  pending: "En attente",
  paid: "Payé",
  rejected: "Rejeté",
};

const withdrawalStatusClass: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  paid: "bg-emerald-500/10 text-emerald-700",
  rejected: "bg-red-500/10 text-red-700",
};

export function AdminCommissionsTab() {
  const overviewFn = useServerFn(getAdminAffiliateOverview);
  const processFn = useServerFn(adminProcessWithdrawal);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [data, setData] = useState<Overview | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const result = await overviewFn();
      setData(result);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const processWithdrawal = async (withdrawalId: string, action: "paid" | "rejected", label: string) => {
    if (!confirm(`${label} cette demande de retrait ?`)) return;

    setActionId(withdrawalId);
    try {
      await processFn({ data: { withdrawalId, action } });
      toast.success(action === "paid" ? "Retrait marqué comme payé" : "Demande rejetée");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action impossible");
    } finally {
      setActionId(null);
    }
  };

  if (loading || !data) {
    return (
      <div className="surface rounded-2xl p-10 text-center text-sm text-muted-foreground">
        Chargement des commissions...
      </div>
    );
  }

  const pendingWithdrawals = data.withdrawals.filter((w) => w.status === "pending");
  const totalBalance = data.affiliates.reduce((sum, a) => sum + a.balanceUsd, 0);
  const totalPaidOut = data.affiliates.reduce((sum, a) => sum + a.withdrawalPaidUsd, 0);
  const totalEarned =
    totalBalance + totalPaidOut + pendingWithdrawals.reduce((sum, w) => sum + w.amount_usd, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            Commissions affiliés
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            ${AFFILIATE_SIGNUP_COMMISSION_USD} par compte créé · ${AFFILIATE_COMMISSION_USD} par inscription payée · retrait min. ${AFFILIATE_MIN_WITHDRAWAL_USD}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="h-4 w-4" /> Actualiser
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Affiliés actifs", value: data.affiliates.length },
          { label: "Commissions gagnées", value: `$${totalEarned.toFixed(2)}` },
          { label: "Solde à payer", value: `$${formatAffiliateUsd(totalBalance)}` },
          { label: "Retraits en attente", value: pendingWithdrawals.length },
        ].map((s) => (
          <div key={s.label} className="surface rounded-xl p-4">
            <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
            <div className="text-2xl font-semibold">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="surface rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-sm">Tous les comptes affiliés</h3>
        </div>
        <div className="table-scroll">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-5 py-3 font-medium">Code</th>
                <th className="px-5 py-3 font-medium">Nom</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Parrainages</th>
                <th className="px-5 py-3 font-medium">Gagnées</th>
                <th className="px-5 py-3 font-medium">Solde</th>
                <th className="px-5 py-3 font-medium">Retraits payés</th>
              </tr>
            </thead>
            <tbody>
              {data.affiliates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">
                    Aucun affilié pour le moment.
                  </td>
                </tr>
              ) : (
                data.affiliates.map((a) => (
                  <tr key={a.code} className="border-b border-border/60 last:border-0">
                    <td className="px-5 py-3 font-mono font-semibold">{a.code}</td>
                    <td className="px-5 py-3">{a.fullName}</td>
                    <td className="px-5 py-3">{a.email}</td>
                    <td className="px-5 py-3">{a.referrals}</td>
                    <td className="px-5 py-3 text-primary font-medium">{a.earned}</td>
                    <td className="px-5 py-3 font-semibold">${formatAffiliateUsd(a.balanceUsd)}</td>
                    <td className="px-5 py-3 text-muted-foreground">
                      ${formatAffiliateUsd(a.withdrawalPaidUsd)}
                      {a.withdrawalPendingUsd > 0 ? (
                        <span className="ml-1 text-amber-600 text-xs">(+${formatAffiliateUsd(a.withdrawalPendingUsd)} att.)</span>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="surface rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Wallet className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Demandes de retrait</h3>
          <span className="text-xs text-muted-foreground ml-auto">{data.withdrawals.length} total</span>
        </div>
        <div className="table-scroll">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Affilié</th>
                <th className="px-5 py-3 font-medium">Montant</th>
                <th className="px-5 py-3 font-medium">Paiement</th>
                <th className="px-5 py-3 font-medium">Statut</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.withdrawals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                    Aucune demande de retrait.
                  </td>
                </tr>
              ) : (
                data.withdrawals.map((w) => (
                  <tr key={w.id} className="border-b border-border/60 last:border-0">
                    <td className="px-5 py-3 whitespace-nowrap text-muted-foreground">
                      {new Date(w.created_at).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-medium">{w.affiliate_email}</div>
                      <div className="text-xs text-muted-foreground font-mono">{w.affiliate_code}</div>
                    </td>
                    <td className="px-5 py-3 font-semibold">${formatAffiliateUsd(w.amount_usd)}</td>
                    <td className="px-5 py-3">
                      <div className="text-xs uppercase font-medium">{w.payment_method}</div>
                      <div className="text-xs text-muted-foreground max-w-[200px] truncate" title={w.payment_details}>
                        {w.payment_details}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${withdrawalStatusClass[w.status] ?? ""}`}
                      >
                        {withdrawalStatusLabel[w.status] ?? w.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      {w.status === "pending" ? (
                        <div className="flex flex-wrap gap-1.5">
                          <Button
                            variant="hero"
                            size="sm"
                            className="text-xs h-8"
                            disabled={actionId === w.id}
                            onClick={() => processWithdrawal(w.id, "paid", "Marquer payé")}
                          >
                            {actionId === w.id ? "..." : "Marquer payé"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-8"
                            disabled={actionId === w.id}
                            onClick={() => processWithdrawal(w.id, "rejected", "Rejeter")}
                          >
                            Rejeter
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {w.processed_at
                            ? new Date(w.processed_at).toLocaleDateString("fr-FR")
                            : "—"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
