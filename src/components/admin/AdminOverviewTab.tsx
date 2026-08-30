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
import { PaymentStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import type { AdminSection } from "@/components/admin/AdminLayout";
import type { getAdminOverview } from "@/lib/fns/admin";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

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

function greetingLabel() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon après-midi";
  return "Bonsoir";
}

export function AdminOverviewTab({ data, onNavigate }: OverviewProps) {
  const { stats, content, recentRegistrations, affiliate, services } = data;
  const publicStudents = siteConfig.stats.studentsBase + stats.total;
  const pending = stats.pending + stats.manual_pending;
  const paidRate = stats.total > 0 ? Math.round((stats.paid / stats.total) * 100) : 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">BelKou · opérations</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-[1.85rem]">
            {greetingLabel()}, {siteConfig.founder.name.split(" ")[0]}
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
            Vue d&apos;ensemble — inscriptions, catalogue, services et revenus affiliés.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full border-black/8 bg-white dark:border-border dark:bg-card"
            onClick={() => onNavigate("inscriptions")}
          >
            Inscriptions
          </Button>
          <Button
            size="sm"
            className="rounded-full bg-primary px-4 text-primary-foreground shadow-[0_8px_20px_rgb(0_70_213_/_0.28)] hover:bg-primary/90"
            onClick={() => onNavigate("courses")}
          >
            Gérer les cours
          </Button>
        </div>
      </div>

      {/* Featured KPI row — Finexy style */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Inscriptions"
          value={stats.total}
          icon={Users}
          highlight
          delta={stats.total > 0 ? `${paidRate}% payées` : undefined}
          onManage={() => onNavigate("inscriptions")}
        />
        <AdminStatCard
          label="Payées"
          value={stats.paid}
          icon={CheckCircle2}
          onManage={() => onNavigate("inscriptions")}
        />
        <AdminStatCard
          label="VIP"
          value={stats.vip}
          icon={Crown}
          onManage={() => onNavigate("vip")}
        />
        <AdminStatCard
          label="Demandes services"
          value={services.newBookings}
          icon={CalendarDays}
          hint={services.newBookings > 0 ? "À traiter" : "Aucune en attente"}
          onManage={() => onNavigate("services")}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Premium"
          value={stats.premium}
          icon={GraduationCap}
          onManage={() => onNavigate("students")}
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
      </div>

      {(content.lessonsWithoutVideo > 0 || pending > 0) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {pending > 0 ? (
            <AdminStatCard
              label="En attente"
              value={pending}
              icon={Users}
              hint="Paiements à confirmer"
              onManage={() => onNavigate("inscriptions")}
            />
          ) : null}
          {content.lessonsWithoutVideo > 0 ? (
            <AdminStatCard
              label="Sans vidéo"
              value={content.lessonsWithoutVideo}
              icon={VideoOff}
              hint="À compléter"
              onManage={() => onNavigate("courses")}
            />
          ) : null}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <section className="rounded-[24px] border border-black/5 bg-white p-5 shadow-[0_8px_24px_rgb(15_23_42_/_0.04)] sm:p-6 dark:border-border dark:bg-card">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold tracking-tight">Catalogue</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {content.courseCount} cours · {content.totalLessons} leçons ·{" "}
                {content.previewLessons} previews
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full border-black/8 bg-[#f8fafc] dark:border-border"
                onClick={() => onNavigate("videos")}
              >
                Vidéos
              </Button>
              <Button
                size="sm"
                className="rounded-full bg-[#eef2ff] text-primary hover:bg-[#e0e7ff] dark:bg-primary/15"
                onClick={() => onNavigate("courses")}
              >
                Cours
              </Button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {content.courses.map((course) => (
              <span
                key={course.slug}
                className="inline-flex items-center rounded-full bg-[#f3f5f9] px-3 py-1.5 text-xs font-medium text-foreground dark:bg-muted"
              >
                {course.title}
                {course.missingVideo > 0 ? (
                  <span className="ml-1.5 font-semibold text-brand-accent-foreground">
                    · {course.missingVideo} sans vidéo
                  </span>
                ) : null}
              </span>
            ))}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { label: "Compteur public", value: publicStudents },
              { label: "En attente", value: pending },
              { label: "Au catalogue", value: content.courseCount },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl bg-[#f3f5f9] px-4 py-3.5 dark:bg-muted/40"
              >
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="mt-1 font-display text-xl font-semibold tabular-nums">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[24px] border border-black/5 bg-white p-5 shadow-[0_8px_24px_rgb(15_23_42_/_0.04)] sm:p-6 dark:border-border dark:bg-card">
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
                className="flex cursor-pointer items-center justify-between rounded-2xl bg-[#f3f5f9] px-4 py-3.5 text-left text-sm font-medium transition hover:bg-[#e8ecf3] dark:bg-muted/40 dark:hover:bg-muted"
              >
                {item.label}
                <span className="text-primary">→</span>
              </button>
            ))}
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-[24px] border border-black/5 bg-white shadow-[0_8px_24px_rgb(15_23_42_/_0.04)] dark:border-border dark:bg-card">
        <div className="flex flex-col gap-3 border-b border-black/5 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-border">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight">Activité récente</h2>
            <p className="mt-1 text-sm text-muted-foreground">Dernières inscriptions plateforme.</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("inscriptions")}
            className="cursor-pointer text-sm font-semibold text-primary hover:underline"
          >
            Voir tout →
          </button>
        </div>

        {recentRegistrations.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">
            Aucune inscription pour le moment.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-black/5 bg-[#f8fafc] text-xs font-semibold tracking-wide text-muted-foreground uppercase dark:border-border dark:bg-muted/30">
                  <th className="px-5 py-3 font-semibold sm:px-6">Étudiant</th>
                  <th className="px-3 py-3 font-semibold">Plan</th>
                  <th className="px-3 py-3 font-semibold">Statut</th>
                  <th className="px-3 py-3 font-semibold">Pays</th>
                  <th className="px-5 py-3 font-semibold sm:px-6">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-border">
                {recentRegistrations.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-[#f8fafc] dark:hover:bg-muted/20">
                    <td className="px-5 py-4 sm:px-6">
                      <p className="font-medium text-foreground">{row.full_name}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{row.email}</p>
                    </td>
                    <td className="px-3 py-4">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
                          row.plan === "vip"
                            ? "bg-brand-accent/20 text-brand-accent-foreground"
                            : "bg-[#eef2ff] text-primary dark:bg-primary/15",
                        )}
                      >
                        {row.plan}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      <PaymentStatusBadge status={row.payment_status} className="text-[10px]" />
                    </td>
                    <td className="px-3 py-4 text-muted-foreground">{row.country}</td>
                    <td className="px-5 py-4 text-muted-foreground sm:px-6">
                      {formatActivityDate(row.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap gap-4 border-t border-black/5 bg-[#f8fafc] px-5 py-3.5 text-sm sm:px-6 dark:border-border dark:bg-muted/20">
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
