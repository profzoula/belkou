import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, ChevronRight, Download, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  adminAddCashRegistration,
  adminGrantFreeVip,
  adminMarkCashPaid,
  getAdminDashboard,
} from "@/lib/fns/admin";
import { siteConfig } from "@/lib/site-config";

const statusLabel: Record<string, string> = {
  paid: "Payé",
  pending: "En attente",
  manual_pending: "Paiement manuel",
};

const statusClass: Record<string, string> = {
  paid: "bg-emerald-500/10 text-emerald-700",
  pending: "bg-amber-500/10 text-amber-700",
  manual_pending: "bg-blue-500/10 text-blue-700",
};

const emptyForm = {
  full_name: "",
  email: "",
  whatsapp: "",
  country: "HT",
  level: "beginner",
  plan: "premium" as "premium" | "vip",
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
  const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
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
};

export function AdminRegistrationsTab({ onStatsLoaded }: AdminRegistrationsTabProps) {
  const dashboardFn = useServerFn(getAdminDashboard);
  const addCashFn = useServerFn(adminAddCashRegistration);
  const markPaidFn = useServerFn(adminMarkCashPaid);
  const grantVipFn = useServerFn(adminGrantFreeVip);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [adding, setAdding] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [sendEmailOnAdd, setSendEmailOnAdd] = useState(true);
  const [data, setData] = useState<Awaited<ReturnType<typeof getAdminDashboard>> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
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
      await addCashFn({ data: { registration: form, sendEmail: sendEmailOnAdd } });
      toast.success(`Inscription cash ajoutée — ${form.full_name}`);
      setForm(emptyForm);
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
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!r.full_name.toLowerCase().includes(query) && !r.email.toLowerCase().includes(query)) {
          return false;
        }
      }
      if (planFilter !== "all" && r.plan !== planFilter) return false;
      if (statusFilter !== "all" && r.payment_status !== statusFilter) return false;
      return true;
    });
  }, [data, searchQuery, planFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRegistrations.length / ROWS_PER_PAGE));
  const paginatedRegistrations = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return filteredRegistrations.slice(start, start + ROWS_PER_PAGE);
  }, [filteredRegistrations, currentPage]);

  if (loading || !data) {
    return (
      <div className="surface rounded-2xl p-10 text-center text-sm text-muted-foreground">
        Chargement des inscriptions...
      </div>
    );
  }

  const { stats, registrations } = data;
  const publicStudents = siteConfig.stats.studentsBase + stats.total;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Inscriptions</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gérez paiements cash, VIP gratuit et export CSV.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="hero" size="sm" onClick={() => setShowAddForm((v) => !v)}>
            <Plus className="h-4 w-4 mr-2" />
            Cash
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportCSV(registrations as unknown as Array<Record<string, unknown>>)}
          >
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
        </div>
      </div>

      {showAddForm && (
        <div className="surface rounded-2xl p-5 sm:p-6">
          <h2 className="font-semibold text-sm mb-1">Ajouter une inscription — paiement cash</h2>
          <form onSubmit={submitCashRegistration} className="grid sm:grid-cols-2 gap-4 mt-4">
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
            <div className="space-y-2">
              <Label>Plan payé</Label>
              <div className="grid grid-cols-2 gap-2">
                {(["premium", "vip"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => updateForm("plan", p)}
                    className={`rounded-xl border p-2 text-sm font-semibold ${
                      form.plan === p ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border"
                    }`}
                  >
                    {p.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <label className="sm:col-span-2 flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={sendEmailOnAdd}
                onChange={(e) => setSendEmailOnAdd(e.target.checked)}
                className="rounded border-border"
              />
              Envoyer l&apos;email de confirmation WhatsApp
            </label>
            <div className="sm:col-span-2 flex gap-2">
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

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total },
          { label: "Payées", value: stats.paid },
          { label: "Premium", value: stats.premium },
          { label: "VIP", value: stats.vip },
        ].map((s) => (
          <div key={s.label} className="surface rounded-xl p-4">
            <div className="text-xs text-muted-foreground">{s.label}</div>
            <div className="text-2xl font-semibold">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="surface rounded-xl p-4 text-sm text-muted-foreground">
        Compteur public : <strong className="text-foreground">{publicStudents}</strong> étudiants
      </div>

      <div className="surface rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex flex-wrap gap-3">
          <Input
            placeholder="Rechercher nom ou email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-lg max-w-xs"
          />
          <Select value={planFilter} onValueChange={setPlanFilter}>
            <SelectTrigger className="rounded-lg w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous plans</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
              <SelectItem value="vip">VIP</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="rounded-lg w-[160px]">
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
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Nom</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Plan</th>
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
                  <td className="px-5 py-3 uppercase text-xs font-semibold">{r.plan}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${statusClass[r.payment_status] ?? ""}`}
                    >
                      {statusLabel[r.payment_status] ?? r.payment_status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {r.payment_status !== "paid" && (
                        <Button
                          variant="hero"
                          size="sm"
                          className="text-xs"
                          disabled={actionId === r.id}
                          onClick={() => markCashPaid(r.id, r.full_name)}
                        >
                          Marquer payé
                        </Button>
                      )}
                      {r.plan !== "vip" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          disabled={actionId === r.id}
                          onClick={() => grantVip(r.id, r.email, r.full_name)}
                        >
                          VIP gratuit
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRegistrations.length > ROWS_PER_PAGE && (
          <div className="px-5 py-3 border-t flex justify-between items-center text-sm">
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
        )}
      </div>
    </div>
  );
}