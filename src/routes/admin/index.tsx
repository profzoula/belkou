import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AdminCommissionsTab } from "@/components/admin/AdminCommissionsTab";
import { AdminCoursesTab } from "@/components/admin/AdminCoursesTab";
import { AdminLayout, type AdminSection } from "@/components/admin/AdminLayout";
import { AdminOverviewTab } from "@/components/admin/AdminOverviewTab";
import { AdminRegistrationsTab } from "@/components/admin/AdminRegistrationsTab";
import { AdminSettingsTab } from "@/components/admin/AdminSettingsTab";
import { adminLogout, getAdminDashboard } from "@/lib/fns/admin";
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

function AdminDashboardPage() {
  const navigate = useNavigate();
  const logoutFn = useServerFn(adminLogout);
  const dashboardFn = useServerFn(getAdminDashboard);
  const [section, setSection] = useState<AdminSection>("overview");
  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getAdminDashboard>>["stats"] | null>(null);

  useEffect(() => {
    dashboardFn()
      .then((data) => setStats(data.stats))
      .catch(() => navigate({ to: "/admin/login" }));
  }, [refreshKey]);

  const logout = async () => {
    await logoutFn();
    toast.success("Déconnexion");
    navigate({ to: "/admin/login" });
  };

  const refresh = () => setRefreshKey((k) => k + 1);

  return (
    <AdminLayout
      active={section}
      onNavigate={setSection}
      onRefresh={refresh}
      onLogout={logout}
    >
      {section === "overview" &&
        (stats ? (
          <AdminOverviewTab stats={stats} onNavigate={setSection} />
        ) : (
          <div className="surface rounded-2xl p-10 text-center text-sm text-muted-foreground">Chargement...</div>
        ))}

      {section === "inscriptions" && (
        <AdminRegistrationsTab
          key={refreshKey}
          onStatsLoaded={setStats}
        />
      )}

      {section === "courses" && <AdminCoursesTab key={refreshKey} />}

      {section === "commissions" && <AdminCommissionsTab key={refreshKey} />}

      {section === "settings" && <AdminSettingsTab key={refreshKey} />}
    </AdminLayout>
  );
}
