import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { LogOut, Plus, RefreshCw, Users } from "lucide-react";
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
      <header className="border-b border-border bg-card">
        <div className="site-container h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <Users className="h-4 w-4 text-primary" />
            Admin BelKou
          </div>
          <div className="flex items-center gap-2">
            <Button variant="hero" size="sm" onClick={() => setShowAddForm((v) => !v)}>
              <Plus className="h-4 w-4" /> Paiement cash
            </Button>
            <Button variant="outline" size="sm" onClick={load}>
              <RefreshCw className="h-4 w-4" /> Actualiser
            </Button>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" /> Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <main className="site-container py-6 sm:py-8 overflow-x-auto">
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
            <span className="text-xs text-muted-foreground">{registrations.length} total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
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
                {registrations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">
                      Aucune inscription pour le moment.
                    </td>
                  </tr>
                ) : (
                  registrations.map((r) => (
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
                              className="text-xs h-8"
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
                              className="text-xs h-8"
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
        </div>

        <p className="mt-6 text-center">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Retour au site
          </Link>
        </p>
      </main>
    </div>
  );
}
