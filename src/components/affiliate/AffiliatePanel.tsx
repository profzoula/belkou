import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Copy, DollarSign, Link2, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { affiliateCodeForUser } from "@/lib/affiliate-code";
import { AFFILIATE_COMMISSION_USD } from "@/lib/affiliate-config";
import { getAffiliateDashboard } from "@/lib/fns/affiliate";
import { useAuth } from "@/hooks/use-auth";

type AffiliatePanelProps = {
  accessToken: string;
};

export function AffiliatePanel({ accessToken }: AffiliatePanelProps) {
  const { user } = useAuth();
  const dashboardFn = useServerFn(getAffiliateDashboard);
  const [data, setData] = useState<Awaited<ReturnType<typeof getAffiliateDashboard>> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardFn({ data: { accessToken } })
      .then(setData)
      .catch(() => setData({ affiliate: null }))
      .finally(() => setLoading(false));
  }, [accessToken, dashboardFn]);

  const siteUrl = (import.meta.env.VITE_SITE_URL ?? "https://belkou.online").replace(/\/$/, "");

  const clientFallback =
    user?.id && user.email
      ? {
          code: affiliateCodeForUser(user),
          link: `${siteUrl}/register?ref=${affiliateCodeForUser(user)}`,
          commissionUsd: AFFILIATE_COMMISSION_USD,
          stats: { referrals: 0, pending: 0, earned: 0, paidOut: 0, balanceUsd: 0, referralsList: [] },
        }
      : null;

  const affiliate = data?.affiliate ?? clientFallback;

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copié`);
    } catch {
      toast.error("Copie impossible");
    }
  };

  if (loading) {
    return (
      <div className="surface rounded-2xl p-6 text-sm text-muted-foreground">
        Chargement du programme affilié...
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="surface rounded-2xl p-6 text-sm text-muted-foreground leading-relaxed">
        <p className="font-medium text-foreground mb-1">Programme affilié</p>
        <p>
          Impossible de générer votre code pour le moment. Déconnectez-vous puis reconnectez-vous.
          Si le problème persiste, contactez le support BelKou.
        </p>
      </div>
    );
  }

  return (
    <div className="surface rounded-2xl border border-border overflow-hidden">
      <div className="border-b border-border bg-gradient-to-br from-primary/[0.06] via-card to-amber-50/30 px-5 py-5 sm:px-6">
        <p className="section-label mb-2">
          <DollarSign className="h-3.5 w-3.5" />
          Programme affilié
        </p>
        <h2 className="font-display text-lg sm:text-xl font-bold">Gagnez ${affiliate.commissionUsd} par inscription</h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Compte gratuit ou payé</strong> — tout le monde peut parrainer.
          Partagez votre lien ou code. Quand quelqu&apos;un s&apos;inscrit et paie la formation, vous recevez{" "}
          <strong className="text-foreground">${affiliate.commissionUsd}</strong> de commission.
        </p>
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-muted/20 px-4 py-3 text-center">
            <div className="text-2xl font-bold text-foreground">{affiliate.stats.referrals}</div>
            <div className="text-xs text-muted-foreground mt-1">Parrainages</div>
          </div>
          <div className="rounded-xl border border-border bg-muted/20 px-4 py-3 text-center">
            <div className="text-2xl font-bold text-primary">{affiliate.stats.earned}</div>
            <div className="text-xs text-muted-foreground mt-1">Commissions gagnées</div>
          </div>
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-center">
            <div className="text-2xl font-bold text-foreground">${affiliate.stats.balanceUsd.toFixed(0)}</div>
            <div className="text-xs text-muted-foreground mt-1">Solde à payer</div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Votre code affilié
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-xl border border-border bg-muted/30 px-4 py-3 font-mono text-lg font-bold tracking-wider">
                {affiliate.code}
              </code>
              <Button type="button" variant="outline" size="icon" onClick={() => copy(affiliate.code, "Code")}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Lien de parrainage
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground truncate">
                <Link2 className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" />
                {affiliate.link}
              </div>
              <Button type="button" variant="outline" size="icon" onClick={() => copy(affiliate.link, "Lien")}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {affiliate.stats.referralsList.length > 0 ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Derniers parrainages
            </p>
            <ul className="space-y-2">
              {affiliate.stats.referralsList.map((ref) => (
                <li
                  key={ref.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/80 px-3 py-2.5 text-sm"
                >
                  <span className="truncate text-muted-foreground">{ref.referred_email}</span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      ref.status === "earned"
                        ? "bg-primary/10 text-primary"
                        : ref.status === "paid_out"
                          ? "bg-emerald-500/10 text-emerald-700"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {ref.status === "earned"
                      ? `+$${ref.amount_usd}`
                      : ref.status === "paid_out"
                        ? "Payé"
                        : "En attente"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className="text-xs text-muted-foreground leading-relaxed">
          Les commissions sont validées après paiement de la formation. Paiement des commissions par virement ou
          MonCash — contactez-nous sur WhatsApp.
        </p>
      </div>
    </div>
  );
}
