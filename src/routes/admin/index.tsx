import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, ChevronRight, DollarSign, Download, LogOut, Plus, RefreshCw, Search, Users } from "lucide-react";
import { AdminCommissionsTab } from "@/components/admin/AdminCommissionsTab";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  adminAddCashRegistration,
  adminGrantFreeVip,
  adminMarkCashPaid,
  adminLogout,
  getAdminDashboard,
} from "@/lib/fns/admin";
import { siteConfig } from "@/lib/site-config";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/admin/")({
  head: () =>
    seoHead({
      title: "Dashboard admin — BelKou",
      path: "/admin",
      noindex: true,
    }),
  component: AdminDashboardPage,
});

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
type AdminTab = "inscriptions" | "commissions";

function exportCSV(registrations: Array<Record<string, unknown>>) {
  const headers = ["Date", "Nom", "Email", "WhatsApp", "Pays", "Niveau", "Plan", "Statut"];
  const rows = registrations.map((r) => [
    r.created_at,
    r.full_name,
    r.email,
    r.whatsapp,
    r.country,
    r.level,
    r.plan,
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

function AdminDashboardPage() {
  const navigate = useNavigate();
  const dashboardFn = useServerFn(getAdminDashboard);
  const addCashFn = useServerFn(adminAddCashRegistration);
  const markPaidFn = useServerFn(adminMarkCashPaid);
  const grantVipFn = useServerFn(adminGrantFreeVip);
  const logoutFn = useServerFn(adminLogout);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [adding, setAdding] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [sendEmailOnAdd, setSendEmailOnAdd] = useState(true);
  const [data, setData] = useState<Awaited<ReturnType<typeof getAdminDashboard>> | null>(null);

  // Search, filter, pagination state
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<AdminTab>("inscriptions");

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, planFilter, statusFilter]);

  const load = async () => {
    setLoading(true);
    try {
      const result = await dashboardFn();
      setData(result);
    } catch {
      navigate({ to: "/admin/login" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const logout = async () => {
    await logoutFn();
    toast.success("Déconnexion");
    navigate({ to: "/admin/login" });
  };

  const updateForm = (key: string, value: string) => {
    setForm((s) => ({ ...s, [key]: value }));
  };

  const submitCashRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      await addCashFn({
        data: {
          registration: form,
          sendEmail: sendEmailOnAdd,
        },
      });
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

  // Client-side filtered registrations
  const filteredRegistrations = useMemo(() => {
    if (!data) return [];
    return data.registrations.filter((r) => {
      // Search by name or email
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = r.full_name.toLowerCase().includes(query);
        const matchesEmail = r.email.toLowerCase().includes(query);
        if (!matchesName && !matchesEmail) return false;
      }
      // Filter by plan
      if (planFilter !== "all" && r.plan !== planFilter) return false;
      // Filter by status
      if (statusFilter !== "all" && r.payment_status !== statusFilter) return false;
      return true;
    });
  }, [data, searchQuery, planFilter, statusFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredRegistrations.length / ROWS_PER_PAGE));
  const paginatedRegistrations = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return filteredRegistrations.slice(start, start + ROWS_PER_PAGE);
  }, [filteredRegistrations, currentPage]);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-sm text-muted-foreground">
        Chargement...
      </div>
    );
  }

  const { stats, registrations } = data;
  const publicStudents = siteConfig.stats.studentsBase + stats.total;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card pt-[env(safe-area-inset-top,0px)]">
        <div className="site-container flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:h-14 sm:py-0">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <Users className="h-4 w-4 text-primary shrink-0" />
            Admin BelKou
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="hero" size="sm" className="touch-target flex-1 sm:flex-none text-xs sm:text-sm" onClick={() => setShowAddForm((v) => !v)}>
              <Plus className="h-4 w-4 shrink-0" /> <span className="truncate">Cash</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="touch-target flex-1 sm:flex-none text-xs sm:text-sm"
              onClick={() => exportCSV(registrations as unknown as Array<Record<string, unknown>>)}
            >
              <Download className="h-4 w-4 shrink-0" /> <span className="truncate">CSV</span>
            </Button>
            <Button variant="outline" size="sm" className="touch-target flex-1 sm:flex-none text-xs sm:text-sm" onClick={load}>
              <RefreshCw className="h-4 w-4 shrink-0" /> <span className="hidden min-[400px]:inline">Actualiser</span>
            </Button>
            <Button variant="ghost" size="sm" className="touch-target flex-1 sm:flex-none text-xs sm:text-sm" onClick={logout}>
              <LogOut className="h-4 w-4 shrink-0" /> <span className="truncate">Sortir</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="site-container py-6 sm:py-8 overflow-x-auto">
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={activeTab === "inscriptions" ? "hero" : "outline"}
            size="sm"
            onClick={() => setActiveTab("inscriptions")}
          >
            <Users className="h-4 w-4" /> Inscriptions
          </Button>
          <Button
            variant={activeTab === "commissions" ? "hero" : "outline"}
            size="sm"
            onClick={() => setActiveTab("commissions")}
          >
            <DollarSign className="h-4 w-4" /> Commissions
          </Button>
        </div>

        {activeTab === "commissions" ? (
          <AdminCommissionsTab />
        ) : (
          <>
        {showAddForm && (
          <div className="surface rounded-2xl p-5 sm:p-6 mb-6">
            <h2 className="font-semibold text-sm mb-1">Ajouter une inscription — paiement cash</h2>
            <p className="text-xs text-muted-foreground mb-5">
              Pour une personne qui a payé en espèces et qui n&apos;est pas encore dans la liste.
            </p>
            <form onSubmit={submitCashRegistration} className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="admin_name">Nom complet</Label>
                <Input
                  id="admin_name"
                  value={form.full_name}
                  onChange={(e) => updateForm("full_name", e.target.value)}
                  placeholder="Jean Pierre"
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
                  placeholder="client@email.com"
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
                  placeholder="+509 3X XX XX XX"
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
                    <SelectItem value="BE">Belgique</SelectItem>
                    <SelectItem value="CH">Suisse</SelectItem>
                    <SelectItem value="OTHER">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Niveau</Label>
                <Select value={form.level} onValueChange={(v) => updateForm("level", v)}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Débutant</SelectItem>
                    <SelectItem value="intermediate">Intermédiaire</SelectItem>
                    <SelectItem value="advanced">Avancé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Plan payé</Label>
                <div className="grid grid-cols-2 gap-3">
                  {(["premium", "vip"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => updateForm("plan", p)}
                      className={`rounded-xl border p-3 text-center text-sm font-semibold transition-all ${
                        form.plan === p
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      {p.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <label className="sm:col-span-2 flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendEmailOnAdd}
                  onChange={(e) => setSendEmailOnAdd(e.target.checked)}
                  className="rounded border-border"
                />
                Envoyer l&apos;email de confirmation avec le lien WhatsApp
              </label>
              <div className="sm:col-span-2 flex flex-wrap gap-2">
                <Button type="submit" variant="hero" size="sm" disabled={adding}>
                  {adding ? "Ajout..." : "Ajouter — payé cash"}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                  Annuler
                </Button>
              </div>
            </form>
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Inscriptions", value: stats.total },
            { label: "Payées", value: stats.paid },
            { label: "Premium", value: stats.premium },
            { label: "VIP", value: stats.vip },
          ].map((s) => (
            <div key={s.label} className="surface rounded-xl p-4">
              <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
              <div className="text-2xl font-semibold">{s.value}</div>
            </div>
          ))}
        </div>

        <div className="surface rounded-xl p-4 mb-6 text-sm text-muted-foreground">
          Compteur public sur le site : <strong className="text-foreground">{publicStudents}</strong> étudiants
          ({siteConfig.stats.studentsBase} base + {stats.total} inscriptions)
        </div>

        <div className="surface rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-sm">Inscriptions récentes</h2>
            <span className="text-xs text-muted-foreground">
              {filteredRegistrations.length === registrations.length
                ? `${registrations.length} total`
                : `${filteredRegistrations.length} / ${registrations.length} résultats`}
            </span>
          </div>

          {/* Search & Filters */}
          <div className="px-4 sm:px-5 py-3 border-b border-border flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
            <div className="relative flex-1 min-w-0 w-full sm:min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="admin_search"
                placeholder="Rechercher par nom ou email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 rounded-lg h-9 text-sm"
              />
            </div>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="rounded-lg h-9 w-full sm:w-[150px] text-sm touch-target">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les plans</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="rounded-lg h-9 w-full sm:w-[180px] text-sm touch-target">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="paid">Payé</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="manual_pending">Paiement manuel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="table-scroll">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Nom</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">WhatsApp</th>
                  <th className="px-5 py-3 font-medium">Plan</th>
                  <th className="px-5 py-3 font-medium">Paiement</th>
                  <th className="px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRegistrations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">
                      {filteredRegistrations.length === 0 && registrations.length > 0
                        ? "Aucun résultat pour ces filtres."
                        : "Aucune inscription pour le moment."}
                    </td>
                  </tr>
                ) : (
                  paginatedRegistrations.map((r) => (
                    <tr key={r.id} className="border-b border-border/60 last:border-0">
                      <td className="px-5 py-3 whitespace-nowrap text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-5 py-3 font-medium">{r.full_name}</td>
                      <td className="px-5 py-3">{r.email}</td>
                      <td className="px-5 py-3 whitespace-nowrap">{r.whatsapp}</td>
                      <td className="px-5 py-3 uppercase text-xs font-semibold">{r.plan}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${statusClass[r.payment_status] ?? ""}`}
                        >
                          {statusLabel[r.payment_status] ?? r.payment_status}
                        </span>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1.5">
                          {r.payment_status !== "paid" && (
                            <Button
                              variant="hero"
                              size="sm"
                              className="text-xs min-h-9 sm:touch-target"
                              disabled={actionId === r.id}
                              onClick={() => markCashPaid(r.id, r.full_name)}
                            >
                              {actionId === r.id ? "..." : "Marquer payé"}
                            </Button>
                          )}
                          {r.plan !== "vip" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs min-h-9 sm:touch-target"
                              disabled={actionId === r.id}
                              onClick={() => grantVip(r.id, r.email, r.full_name)}
                            >
                              VIP gratuit
                            </Button>
                          )}
                          {r.payment_status === "paid" && r.plan === "vip" && (
                            <span className="text-xs text-muted-foreground self-center">Actif</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredRegistrations.length > ROWS_PER_PAGE && (
            <div className="px-5 py-3 border-t border-border flex items-center justify-between text-sm">
              <span className="text-xs text-muted-foreground">
                Page {currentPage} sur {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" /> Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  Suivant <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
          </>
        )}

        <p className="mt-6 text-center">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Retour au site
          </Link>
        </p>
      </main>
    </div>
  );
}
