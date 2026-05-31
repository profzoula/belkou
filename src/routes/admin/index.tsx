import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { LogOut, RefreshCw, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { adminLogout, getAdminDashboard } from "@/lib/fns/admin";
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

function AdminDashboardPage() {
  const navigate = useNavigate();
  const dashboardFn = useServerFn(getAdminDashboard);
  const logoutFn = useServerFn(adminLogout);
  const [loading, setLoading] = useState(true);
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
                </tr>
              </thead>
              <tbody>
                {registrations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
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
