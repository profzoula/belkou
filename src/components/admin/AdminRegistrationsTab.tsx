import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, ChevronRight, Download, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PaymentStatusBadge } from "@/components/admin/AdminStatusBadge";
import {
  adminAddCashRegistration,
  adminGrantFreeVip,
  adminMarkCashPaid,
  adminSetPaymentPending,
  getAdminDashboard,
} from "@/lib/fns/admin";
import { siteConfig } from "@/lib/site-config";

const emptyForm = {
  full_name: "",
  email: "",
  whatsapp: "",
  country: "HT",
  level: "beginner",
  plan: "premium" as "premium" | "vip" | "live",
};

const ROWS_PER_PAGE = 20;

function exportCSV(registrations: Array<Record<string, unknown>>) {
  const headers = ["Date", "Nom", "Email", "WhatsApp", "Pays", "Niveau", "Plan", "Cours", "Statut"];
  const rows = registrations.map((r) => [
    r.created_at,
    r.full_name,
    r.email,
    r.whatsapp,
    r.country,
    r.level,
    r.plan,
    r.course_slug ?? "",
    r.payment_status,
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `belkou-inscriptions-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

type AdminRegistrationsTabProps = {
  onStatsLoaded?: (stats: Awaited<ReturnType<typeof getAdminDashboard>>["stats"]) => void;
  /** VIP sidebar: only $450 VIP memberships. */
  mode?: "all" | "vip";
};

export function AdminRegistrationsTab({
  onStatsLoaded,
  mode = "all",
}: AdminRegistrationsTabProps) {
  const isVipMode = mode === "vip";
  const dashboardFn = useServerFn(getAdminDashboard);
  const addCashFn = useServerFn(adminAddCashRegistration);
  const markPaidFn = useServerFn(adminMarkCashPaid);
  const setPendingFn = useServerFn(adminSetPaymentPending);
  const grantVipFn = useServerFn(adminGrantFreeVip);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [adding, setAdding] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [form, setForm] = useState({
    ...emptyForm,
    plan: (isVipMode ? "vip" : "premium") as "premium" | "vip" | "live",
  });
  const [sendEmailOnAdd, setSendEmailOnAdd] = useState(true);
  const [data, setData] = useState<Awaited<ReturnType<typeof getAdminDashboard>> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState(isVipMode ? "vip" : "all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, planFilter, statusFilter]);

  const load = async () => {
    setLoading(true);
    try {
      const result = await dashboardFn();
      setData(result);
      onStatsLoaded?.(result.stats);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Chargement impossible");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  const updateForm = (key: string, value: string) => {
    setForm((s) => ({ ...s, [key]: value }));
  };

  const submitCashRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      await addCashFn({
        data: {
          registration: { ...form, plan: isVipMode ? "vip" : form.plan },
          sendEmail: sendEmailOnAdd,
        },
      });
      toast.success(`Inscription cash ajoutée — ${form.full_name}`);
      setForm({
        ...emptyForm,
        plan: (isVipMode ? "vip" : "premium") as "premium" | "vip" | "live",
      });
      setShowAddForm(false);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ajout impossible");
    } finally {
      setAdding(false);
    }
  };

  const markCashPaid = async (registrationId: string, name: string) => {
    if (!confirm(`Confirmer le paiement cash pour ${name} ?`)) return;
    setActionId(registrationId);
    try {
      await markPaidFn({ data: { registrationId, sendEmail: true } });
      toast.success(`Paiement cash confirmé — ${name}`);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action impossible");
    } finally {
      setActionId(null);
    }
  };

  const setPending = async (registrationId: string, name: string) => {
    if (
      !confirm(
        `Remettre ${name} en attente (pending) ? L'accès au cours sera retiré jusqu'au paiement.`,
      )
    ) {
      return;
    }
    setActionId(registrationId);
    try {
      await setPendingFn({ data: { registrationId, status: "pending" } });
      toast.success(`Statut remis en attente — ${name}`);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action impossible");
    } finally {
      setActionId(null);
    }
  };

  const grantVip = async (registrationId: string, email: string, name: string) => {
    if (!confirm(`Offrir le plan VIP gratuit à ${name} (${email}) ?`)) return;
    setActionId(registrationId);
    try {
      await grantVipFn({ data: { registrationId, sendEmail: true } });
      toast.success(`VIP gratuit activé pour ${name}`);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action impossible");
    } finally {
      setActionId(null);
    }
  };

  const filteredRegistrations = useMemo(() => {
    if (!data) return [];
    return data.registrations.filter((r) => {
      if (isVipMode && r.plan !== "vip") return false;
      if (!isVipMode && r.plan === "vip") return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!r.full_name.toLowerCase().includes(query) && !r.email.toLowerCase().includes(query)) {
          return false;
        }
      }
      if (!isVipMode && planFilter !== "all" && r.plan !== planFilter) return false;
      if (statusFilter !== "all" && r.payment_status !== statusFilter) return false;
      return true;
    });
  }, [data, searchQuery, planFilter, statusFilter, isVipMode]);

  const totalPages = Math.max(1, Math.ceil(filteredRegistrations.length / ROWS_PER_PAGE));
  const paginatedRegistrations = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return filteredRegistrations.slice(start, start + ROWS_PER_PAGE);
  }, [filteredRegistrations, currentPage]);

  if (loading || !data) {
    return (
      <div className="surface rounded-2xl p-10 text-center text-sm text-muted-foreground">
        Chargement {isVipMode ? "VIP" : "des inscriptions"}...
      </div>
    );
  }

  const { stats, registrations } = data;
  const publicStudents = siteConfig.stats.studentsBase + stats.total;
  const vipRows = registrations.filter((r) => r.plan === "vip");
  const vipPaid = vipRows.filter((r) => r.payment_status === "paid").length;
  const pendingCount = filteredRegistrations.filter((r) => r.payment_status !== "paid").length;
  const paidCount = filteredRegistrations.filter((r) => r.payment_status === "paid").length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Ops"
        title={isVipMode ? "VIP" : "Inscriptions"}
        description={
          isVipMode
            ? "Membres accès illimité VIP ($450) — tous les cours et lives."
            : "Cours et lives — paiements cash, statut et export CSV."
        }
        actions={
          <>
            <Button
              variant="hero"
              size="sm"
              className="rounded-xl"
              onClick={() => setShowAddForm((v) => !v)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Cash
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() =>
                exportCSV(
                  (isVipMode
                    ? vipRows
                    : registrations.filter((r) => r.plan !== "vip")) as unknown as Array<
                    Record<string, unknown>
                  >,
                )
              }
            >
              <Download className="mr-2 h-4 w-4" />
              CSV
            </Button>
          </>
        }
      />

      {showAddForm && (
        <div className="surface rounded-2xl p-5 sm:p-6">
          <h2 className="mb-1 text-sm font-semibold">
            {isVipMode
              ? "Ajouter un membre VIP — paiement cash"
              : "Ajouter une inscription — paiement cash"}
          </h2>
          <form onSubmit={submitCashRegistration} className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="admin_name">Nom complet</Label>
              <Input
                id="admin_name"
                value={form.full_name}
                onChange={(e) => updateForm("full_name", e.target.value)}
                className="rounded-lg"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin_email">Email</Label>
              <Input
                id="admin_email"
                type="email"
                value={form.email}
                onChange={(e) => updateForm("email", e.target.value)}
                className="rounded-lg"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin_whatsapp">WhatsApp</Label>
              <Input
                id="admin_whatsapp"
                value={form.whatsapp}
                onChange={(e) => updateForm("whatsapp", e.target.value)}
                className="rounded-lg"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Pays</Label>
              <Select value={form.country} onValueChange={(v) => updateForm("country", v)}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HT">Haïti</SelectItem>
                  <SelectItem value="US">États-Unis</SelectItem>
                  <SelectItem value="CA">Canada</SelectItem>
                  <SelectItem value="DO">République dominicaine</SelectItem>
                  <SelectItem value="FR">France</SelectItem>
                  <SelectItem value="OTHER">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {!isVipMode ? (
              <div className="space-y-2">
                <Label>Plan payé</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["premium", "live"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => updateForm("plan", p)}
                      className={`rounded-xl border p-2 text-sm font-semibold ${
                        form.plan === p
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                          : "border-border"
                      }`}
                    >
                      {p.toUpperCase()}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Pour le plan VIP $450, utilisez la section VIP dans le menu.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Plan</Label>
                <div className="rounded-xl border border-primary/40 bg-primary/5 p-3 text-sm font-semibold">
                  VIP — $450 · accès illimité
                </div>
              </div>
            )}
            <label className="flex cursor-pointer items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={sendEmailOnAdd}
                onChange={(e) => setSendEmailOnAdd(e.target.checked)}
                className="rounded border-border"
              />
              Envoyer l&apos;email de confirmation
            </label>
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" variant="hero" size="sm" disabled={adding}>
                {adding ? "Ajout..." : "Ajouter"}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                Annuler
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(isVipMode
          ? [
              { label: "Membres VIP", value: vipRows.length },
              { label: "VIP payés", value: vipPaid },
              { label: "En attente", value: vipRows.length - vipPaid },
            ]
          : [
              { label: "Total", value: filteredRegistrations.length },
              { label: "Payées", value: paidCount },
              { label: "En attente", value: pendingCount },
            ]
        ).map((s) => (
          <div key={s.label} className="surface rounded-xl p-4">
            <div className="text-xs text-muted-foreground">{s.label}</div>
            <div className="text-2xl font-semibold">{s.value}</div>
          </div>
        ))}
      </div>

      {!isVipMode ? (
        <div className="surface rounded-xl p-4 text-sm text-muted-foreground">
          Compteur public : <strong className="text-foreground">{publicStudents}</strong> étudiants
        </div>
      ) : null}

      <div className="surface overflow-hidden rounded-2xl">
        <div className="flex flex-wrap gap-3 border-b border-border px-5 py-4">
          <Input
            placeholder="Rechercher nom ou email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs rounded-lg"
          />
          {!isVipMode ? (
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-[140px] rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous plans</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="live">Live</SelectItem>
              </SelectContent>
            </Select>
          ) : null}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              <SelectItem value="paid">Payé</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="manual_pending">Manuel</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="table-scroll">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Nom</th>
                <th className="px-5 py-3">Email</th>
                {!isVipMode ? <th className="px-5 py-3">Plan</th> : null}
                <th className="px-5 py-3">Statut</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRegistrations.map((r) => (
                <tr key={r.id} className="border-b border-border/60">
                  <td className="px-5 py-3 text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-5 py-3 font-medium">{r.full_name}</td>
                  <td className="px-5 py-3">{r.email}</td>
                  {!isVipMode ? (
                    <td className="px-5 py-3 text-xs font-semibold uppercase">{r.plan}</td>
                  ) : null}
                  <td className="px-5 py-3">
                    <PaymentStatusBadge status={r.payment_status} className="text-[11px]" />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {r.payment_status !== "paid" ? (
                        <Button
                          variant="hero"
                          size="sm"
                          className="text-xs"
                          disabled={actionId === r.id}
                          onClick={() => markCashPaid(r.id, r.full_name)}
                        >
                          Marquer payé
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          disabled={actionId === r.id}
                          onClick={() => setPending(r.id, r.full_name)}
                        >
                          Remettre pending
                        </Button>
                      )}
                      {!isVipMode && r.plan !== "vip" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          disabled={actionId === r.id}
                          onClick={() => grantVip(r.id, r.email, r.full_name)}
                        >
                          VIP gratuit
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRegistrations.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">
            Aucune inscription {isVipMode ? "VIP" : ""} pour ces filtres.
          </div>
        ) : null}

        {filteredRegistrations.length > ROWS_PER_PAGE ? (
          <div className="flex items-center justify-between border-t px-5 py-3 text-sm">
            <span className="text-xs text-muted-foreground">
              Page {currentPage} / {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
