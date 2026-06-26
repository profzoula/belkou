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
import { AdminStudentsTab } from "@/components/admin/AdminStudentsTab";
import { adminLogout, getAdminOverview, refreshAdminSession } from "@/lib/fns/admin";
import { clearAdminSessionToken, getAdminSessionToken, setAdminSessionToken } from "@/lib/admin-session";
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
  const overviewFn = useServerFn(getAdminOverview);
  const refreshSessionFn = useServerFn(refreshAdminSession);
  const [section, setSection] = useState<AdminSection>("overview");
  const [refreshKey, setRefreshKey] = useState(0);
  const [overview, setOverview] = useState<Awaited<ReturnType<typeof getAdminOverview>> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getAdminSessionToken()) {
      refreshSessionFn()
        .then((result) => {
          if (result.ok && result.token) {
            setAdminSessionToken(result.token);
          }
        })
        .catch(() => {
          /* cookie session missing — login redirect handled by overview load */
        });
    }
  }, [refreshSessionFn]);

  useEffect(() => {
    setLoading(true);
    overviewFn()
      .then(setOverview)
      .catch(() => navigate({ to: "/admin/login" }))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const logout = async () => {
    clearAdminSessionToken();
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
      refreshing={loading}
      onLogout={logout}
    >
      {section === "overview" &&
        (overview ? (
          <AdminOverviewTab data={overview} onNavigate={setSection} />
        ) : (
          <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground shadow-sm">
            Chargement du dashboard...
          </div>
        ))}

      {section === "inscriptions" && (
        <AdminRegistrationsTab
          key={refreshKey}
          onStatsLoaded={(stats) =>
            setOverview((current) => (current ? { ...current, stats } : current))
          }
        />
      )}

      {section === "courses" && <AdminCoursesTab key={refreshKey} />}

      {section === "students" && <AdminStudentsTab key={refreshKey} />}

      {section === "commissions" && <AdminCommissionsTab key={refreshKey} />}

      {section === "settings" && <AdminSettingsTab key={refreshKey} />}
    </AdminLayout>
  );
}
