import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Copy, DollarSign, Link2, Users, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { affiliateCodeForUser } from "@/lib/affiliate-code";
import {
  AFFILIATE_COMMISSION_USD,
  AFFILIATE_MIN_WITHDRAWAL_USD,
  AFFILIATE_SIGNUP_COMMISSION_USD,
} from "@/lib/affiliate-config";

function formatUsd(amount: number): string {
  return amount < 1 ? amount.toFixed(2) : amount.toFixed(amount % 1 === 0 ? 0 : 2);
}
import { getAffiliateDashboard, requestAffiliateWithdrawalFn } from "@/lib/fns/affiliate";
import { useAuth } from "@/hooks/use-auth";

type AffiliatePanelProps = {
  accessToken: string;
};

export function AffiliatePanel({ accessToken }: AffiliatePanelProps) {
  const { user } = useAuth();
  const dashboardFn = useServerFn(getAffiliateDashboard);
  const withdrawFn = useServerFn(requestAffiliateWithdrawalFn);
  const [data, setData] = useState<Awaited<ReturnType<typeof getAffiliateDashboard>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("moncash");
  const [paymentDetails, setPaymentDetails] = useState("");

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
          signupCommissionUsd: AFFILIATE_SIGNUP_COMMISSION_USD,
          stats: {
            referrals: 0,
            pending: 0,
            earned: 0,
            earnedUsd: 0,
            paidOut: 0,
            balanceUsd: 0,
            withdrawalPaidUsd: 0,
            withdrawalPendingUsd: 0,
            hasPendingWithdrawal: false,
            referralsList: [],
          },
          minWithdrawalUsd: AFFILIATE_MIN_WITHDRAWAL_USD,
        }
      : null;

  const affiliate = data?.affiliate ?? clientFallback;
  const canWithdraw =
    affiliate &&
    affiliate.stats.balanceUsd >= (affiliate.minWithdrawalUsd ?? AFFILIATE_MIN_WITHDRAWAL_USD) &&
    !affiliate.stats.hasPendingWithdrawal;

  const submitWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWithdraw) return;

    setWithdrawing(true);
    try {
      const result = await withdrawFn({
        data: { accessToken, paymentMethod, paymentDetails },
      });

      if (!result.ok) {
        toast.error("reason" in result ? result.reason : "Demande impossible");
        return;
      }

      toast.success(`Demande de retrait de $${result.amount.toFixed(0)} envoyée`);
      setShowWithdrawForm(false);
      setPaymentDetails("");
      setData((prev) =>
        prev?.affiliate
          ? {
              ...prev,
              affiliate: {
                ...prev.affiliate,
                stats: result.stats,
              },
            }
          : prev,
      );
    } catch {
      toast.error("Demande impossible. Réessayez plus tard.");
    } finally {
      setWithdrawing(false);
    }
  };

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
      <div className="border-b border-border bg-gradient-to-br from-primary/[0.06] via-card to-amber-50/30 dark:to-primary/10 px-5 py-5 sm:px-6">
        <p className="section-label mb-2">
          <DollarSign className="h-3.5 w-3.5" />
          Programme affilié
        </p>
        <h2 className="font-display text-base sm:text-lg md:text-xl font-bold text-balance">
          ${affiliate.signupCommissionUsd ?? AFFILIATE_SIGNUP_COMMISSION_USD} par compte · ${affiliate.commissionUsd} par inscription payée
        </h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Compte gratuit ou payé</strong> — tout le monde peut parrainer.
          Partagez votre lien : <strong className="text-foreground">${affiliate.signupCommissionUsd ?? AFFILIATE_SIGNUP_COMMISSION_USD}</strong> quand
          quelqu&apos;un crée un compte, <strong className="text-foreground">${affiliate.commissionUsd}</strong> s&apos;il paie la formation.
        </p>
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-muted/20 px-4 py-3 text-center">
            <div className="text-2xl font-bold text-foreground">{affiliate.stats.referrals}</div>
            <div className="text-xs text-muted-foreground mt-1">Parrainages</div>
          </div>
          <div className="rounded-xl border border-border bg-muted/20 px-4 py-3 text-center">
            <div className="text-2xl font-bold text-primary">${formatUsd(affiliate.stats.earnedUsd ?? affiliate.stats.balanceUsd)}</div>
            <div className="text-xs text-muted-foreground mt-1">Commissions gagnées</div>
          </div>
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-center">
            <div className="text-2xl font-bold text-foreground">${formatUsd(affiliate.stats.balanceUsd)}</div>
            <div className="text-xs text-muted-foreground mt-1">Solde à payer</div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Votre code affilié
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <code className="flex-1 min-w-0 rounded-xl border border-border bg-muted/30 px-4 py-3 font-mono text-base sm:text-lg font-bold tracking-wider break-all">
                {affiliate.code}
              </code>
              <Button type="button" variant="outline" size="icon" className="shrink-0 self-end sm:self-auto touch-target" onClick={() => copy(affiliate.code, "Code")}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Lien de parrainage
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex-1 min-w-0 rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground truncate">
                <Link2 className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" />
                {affiliate.link}
              </div>
              <Button type="button" variant="outline" size="icon" className="shrink-0 self-end sm:self-auto touch-target" onClick={() => copy(affiliate.link, "Lien")}>
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
                      ? `+$${formatUsd(ref.amount_usd)}${ref.referral_type === "signup" ? " compte" : ""}`
                      : ref.status === "paid_out"
                        ? "Payé"
                        : "En attente"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold flex items-center gap-1.5">
                <Wallet className="h-4 w-4 text-primary" />
                Retrait des commissions
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Minimum ${affiliate.minWithdrawalUsd ?? AFFILIATE_MIN_WITHDRAWAL_USD} pour demander un retrait.
                {affiliate.stats.hasPendingWithdrawal
                  ? " Une demande est déjà en cours de traitement."
                  : affiliate.stats.balanceUsd > 0
                    ? ` Solde disponible : $${formatUsd(affiliate.stats.balanceUsd)}.`
                    : ""}
              </p>
            </div>
            {canWithdraw ? (
              <Button
                type="button"
                variant="hero"
                size="sm"
                className="w-full sm:w-auto shrink-0 touch-target"
                onClick={() => setShowWithdrawForm((v) => !v)}
              >
                Demander un retrait
              </Button>
            ) : null}
          </div>

          {showWithdrawForm && canWithdraw ? (
            <form onSubmit={submitWithdrawal} className="space-y-3 pt-2 border-t border-border">
              <p className="text-sm">
                Montant demandé :{" "}
                <strong className="text-foreground">${formatUsd(affiliate.stats.balanceUsd)}</strong>
              </p>
              <div className="space-y-2">
                <Label>Méthode de paiement</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="moncash">MonCash</SelectItem>
                    <SelectItem value="zelle">Zelle</SelectItem>
                    <SelectItem value="bank">Virement bancaire</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment_details">Coordonnées de paiement</Label>
                <Input
                  id="payment_details"
                  value={paymentDetails}
                  onChange={(e) => setPaymentDetails(e.target.value)}
                  placeholder={
                    paymentMethod === "moncash"
                      ? "+509 3X XX XX XX"
                      : paymentMethod === "zelle"
                        ? "email ou téléphone Zelle"
                        : "Nom banque + numéro de compte"
                  }
                  className="rounded-lg"
                  required
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" variant="hero" size="sm" disabled={withdrawing}>
                  {withdrawing ? "Envoi..." : "Confirmer la demande"}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowWithdrawForm(false)}>
                  Annuler
                </Button>
              </div>
            </form>
          ) : null}
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Les commissions sont validées après paiement de la formation. Les retraits sont traités sous 3 à 7 jours
          ouvrés via MonCash, Zelle ou virement.
        </p>
      </div>
    </div>
  );
}
