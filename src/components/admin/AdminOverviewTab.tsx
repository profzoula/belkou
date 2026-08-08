import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Crown,
  DollarSign,
  GraduationCap,
  UserPlus,
  Users,
  Video,
  VideoOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PaymentStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import type { AdminSection } from "@/components/admin/AdminLayout";
import type { getAdminOverview } from "@/lib/fns/admin";
import { siteConfig } from "@/lib/site-config";

type OverviewData = Awaited<ReturnType<typeof getAdminOverview>>;

type OverviewProps = {
  data: OverviewData;
  onNavigate: (section: AdminSection) => void;
};

function formatActivityDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function AdminOverviewTab({ data, onNavigate }: OverviewProps) {
  const { stats, content, recentRegistrations, affiliate, services } = data;
  const publicStudents = siteConfig.stats.studentsBase + stats.total;

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Ops"
        title="Dashboard"
        description="Vue d'ensemble BelKou — inscriptions, catalogue, services et revenus affiliés."
        actions={
          <>
            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => onNavigate("inscriptions")}>
              Inscriptions
            </Button>
            <Button variant="hero" size="sm" className="rounded-xl shadow-primary" onClick={() => onNavigate("courses")}>
              Gérer les cours
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Inscriptions"
          value={stats.total}
          icon={Users}
          onManage={() => onNavigate("inscriptions")}
        />
        <AdminStatCard
          label="Payées"
          value={stats.paid}
          icon={CheckCircle2}
          onManage={() => onNavigate("inscriptions")}
        />
        <AdminStatCard
          label="Premium"
          value={stats.premium}
          icon={GraduationCap}
          onManage={() => onNavigate("students")}
        />
        <AdminStatCard
          label="VIP"
          value={stats.vip}
          icon={Crown}
          onManage={() => onNavigate("inscriptions")}
        />
        <AdminStatCard
          label="Cours publiés"
          value={content.courseCount}
          icon={BookOpen}
          onManage={() => onNavigate("courses")}
        />
        <AdminStatCard
          label="Leçons vidéo"
          value={content.videoLessons}
          icon={Video}
          onManage={() => onNavigate("courses")}
        />
        <AdminStatCard
          label="Affiliés"
          value={affiliate.affiliateCount}
          icon={UserPlus}
          onManage={() => onNavigate("commissions")}
        />
        <AdminStatCard
          label="Demandes services"
          value={services.newBookings}
          icon={CalendarDays}
          highlight={services.newBookings > 0}
          onManage={() => onNavigate("services")}
          hint={services.newBookings > 0 ? "À traiter" : undefined}
        />
        <AdminStatCard
          label="Sans vidéo"
          value={content.lessonsWithoutVideo}
          icon={VideoOff}
          highlight={content.lessonsWithoutVideo > 0}
          onManage={() => onNavigate("courses")}
          hint={content.lessonsWithoutVideo > 0 ? "À compléter" : undefined}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-[20px] border border-border/80 bg-card p-6 shadow-[0_8px_24px_rgb(15_23_42_/_0.04)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <h2 className="font-display text-lg font-semibold tracking-tight">Catalogue</h2>
              <p className="text-sm text-muted-foreground">
                {content.courseCount} cours · {content.totalLessons} leçons · {content.previewLessons}{" "}
                previews
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="rounded-xl" onClick={() => onNavigate("videos")}>
                Vidéos
              </Button>
              <Button variant="soft" size="sm" className="rounded-xl" onClick={() => onNavigate("courses")}>
                Cours
              </Button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {content.courses.map((course) => (
              <span
                key={course.slug}
                className="inline-flex items-center rounded-full border border-border/80 bg-muted/50 px-3 py-1.5 text-xs font-medium"
              >
                {course.title}
                {course.missingVideo > 0 ? (
                  <span className="ml-1.5 text-amber-700 dark:text-amber-400">
                    ({course.missingVideo} sans vidéo)
                  </span>
                ) : null}
              </span>
            ))}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { label: "Compteur public", value: publicStudents },
              { label: "En attente", value: stats.pending + stats.manual_pending },
              { label: "Au catalogue", value: content.courseCount },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-border/60 bg-muted/30 px-4 py-3"
              >
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="mt-1 font-display text-xl font-semibold tabular-nums">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[20px] border border-border/80 bg-card p-6 shadow-[0_8px_24px_rgb(15_23_42_/_0.04)]">
          <h2 className="font-display text-lg font-semibold tracking-tight">Actions rapides</h2>
          <p className="mt-1 text-sm text-muted-foreground">Accès direct aux flux critiques.</p>
          <div className="mt-5 grid gap-2">
            {[
              { label: "Inscriptions", section: "inscriptions" as const },
              { label: "Étudiants", section: "students" as const },
              { label: "Services / bookings", section: "services" as const },
              { label: "Revenus affiliés", section: "commissions" as const },
              { label: "Paramètres site", section: "settings" as const },
            ].map((item) => (
              <button
                key={item.section}
                type="button"
                onClick={() => onNavigate(item.section)}
                className="flex cursor-pointer items-center justify-between rounded-xl border border-transparent bg-muted/40 px-3.5 py-3 text-left text-sm font-medium transition hover:border-border hover:bg-muted"
              >
                {item.label}
                <span className="text-primary">→</span>
              </button>
            ))}
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-[20px] border border-border/80 bg-card shadow-[0_8px_24px_rgb(15_23_42_/_0.04)]">
        <div className="border-b border-border/70 px-6 py-5">
          <h2 className="font-display text-lg font-semibold tracking-tight">Activité récente</h2>
          <p className="mt-1 text-sm text-muted-foreground">Dernières inscriptions plateforme.</p>
        </div>

        {recentRegistrations.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">
            Aucune inscription pour le moment.
          </div>
        ) : (
          <ul className="divide-y divide-border/70">
            {recentRegistrations.map((row) => (
              <li
                key={row.id}
                className="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium">{row.full_name}</p>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {row.plan}
                    </span>
                    <PaymentStatusBadge status={row.payment_status} className="text-[10px]" />
                  </div>
                  <p className="mt-1 truncate text-sm text-muted-foreground">{row.email}</p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span>{row.country}</span>
                  <span>{formatActivityDate(row.created_at)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap gap-4 border-t border-border/70 bg-muted/20 px-6 py-3.5 text-sm">
          <button
            type="button"
            onClick={() => onNavigate("inscriptions")}
            className="cursor-pointer font-semibold text-primary hover:underline"
          >
            Toutes les inscriptions →
          </button>
          <button
            type="button"
            onClick={() => onNavigate("commissions")}
            className="inline-flex cursor-pointer items-center font-semibold text-primary hover:underline"
          >
            <DollarSign className="mr-1 size-3.5" aria-hidden />
            Retraits affiliés ({affiliate.pendingWithdrawals}) →
          </button>
          <Link to="/courses" className="font-semibold text-primary hover:underline">
            Site public →
          </Link>
        </div>
      </section>
    </div>
  );
}
