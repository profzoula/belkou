import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AdminCategoriesTab } from "@/components/admin/AdminCategoriesTab";
import { AdminCommissionsTab } from "@/components/admin/AdminCommissionsTab";
import { AdminCoursesTab } from "@/components/admin/AdminCoursesTab";
import { AdminLayout, type AdminSection } from "@/components/admin/AdminLayout";
import { AdminLiveTab } from "@/components/admin/AdminLiveTab";
import { AdminOverviewTab } from "@/components/admin/AdminOverviewTab";
import { AdminRegistrationsTab } from "@/components/admin/AdminRegistrationsTab";
import { AdminServicesTab } from "@/components/admin/AdminServicesTab";
import { AdminSettingsTab } from "@/components/admin/AdminSettingsTab";
import { AdminStudentsTab } from "@/components/admin/AdminStudentsTab";
import { AdminVideosTab } from "@/components/admin/AdminVideosTab";
import { adminLogout, getAdminOverview, refreshAdminSession } from "@/lib/fns/admin";
import {
  clearAdminSessionToken,
  getAdminSessionToken,
  setAdminSessionToken,
} from "@/lib/admin-session";
import { seoHead } from "@/lib/seo";
import { cn } from "@/lib/utils";

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
  const [mounted, setMounted] = useState<Partial<Record<AdminSection, true>>>({
    overview: true,
  });
  const [tabEpoch, setTabEpoch] = useState<Partial<Record<AdminSection, number>>>({});
  const [overview, setOverview] = useState<Awaited<ReturnType<typeof getAdminOverview>> | null>(
    null,
  );
  const [overviewEpoch, setOverviewEpoch] = useState(0);
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
    let cancelled = false;
    setLoading(true);
    overviewFn()
      .then((data) => {
        if (!cancelled) setOverview(data);
      })
      .catch(() => {
        if (!cancelled) navigate({ to: "/admin/login" });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [overviewEpoch, overviewFn, navigate]);

  const goTo = useCallback((next: AdminSection) => {
    setSection(next);
    setMounted((current) => (current[next] ? current : { ...current, [next]: true }));
  }, []);

  const logout = async () => {
    clearAdminSessionToken();
    await logoutFn();
    toast.success("Déconnexion");
    navigate({ to: "/admin/login" });
  };

  const refresh = () => {
    if (section === "overview") {
      setOverviewEpoch((value) => value + 1);
      return;
    }
    setTabEpoch((current) => ({
      ...current,
      [section]: (current[section] ?? 0) + 1,
    }));
  };

  const panel = (id: AdminSection, node: React.ReactNode) => {
    if (!mounted[id]) return null;
    return (
      <div
        className={cn(section !== id && "hidden")}
        aria-hidden={section !== id}
        inert={section !== id ? true : undefined}
      >
        {node}
      </div>
    );
  };

  return (
    <AdminLayout
      active={section}
      onNavigate={goTo}
      onRefresh={refresh}
      refreshing={loading && section === "overview"}
      onLogout={logout}
    >
      {panel(
        "overview",
        overview ? (
          <AdminOverviewTab data={overview} onNavigate={goTo} />
        ) : (
          <div className="rounded-[24px] border border-black/5 bg-white p-12 text-center text-sm text-muted-foreground shadow-[0_8px_24px_rgb(15_23_42_/_0.04)] dark:border-border dark:bg-card">
            Chargement du dashboard…
          </div>
        ),
      )}

      {panel(
        "inscriptions",
        <AdminRegistrationsTab
          key={tabEpoch.inscriptions ?? 0}
          onStatsLoaded={(stats) =>
            setOverview((current) => (current ? { ...current, stats } : current))
          }
        />,
      )}

      {panel(
        "vip",
        <AdminRegistrationsTab key={`vip-${tabEpoch.vip ?? 0}`} mode="vip" />,
      )}

      {panel("courses", <AdminCoursesTab key={tabEpoch.courses ?? 0} />)}
      {panel("categories", <AdminCategoriesTab key={tabEpoch.categories ?? 0} />)}
      {panel("live", <AdminLiveTab key={tabEpoch.live ?? 0} />)}
      {panel("videos", <AdminVideosTab key={tabEpoch.videos ?? 0} />)}
      {panel("services", <AdminServicesTab key={tabEpoch.services ?? 0} />)}
      {panel("students", <AdminStudentsTab key={tabEpoch.students ?? 0} />)}
      {panel("commissions", <AdminCommissionsTab key={tabEpoch.commissions ?? 0} />)}
      {panel("settings", <AdminSettingsTab key={tabEpoch.settings ?? 0} />)}
    </AdminLayout>
  );
}
