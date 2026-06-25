import { Link } from "@tanstack/react-router";
import {
  BookOpen,
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
import { siteConfig } from "@/lib/site-config";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import type { AdminSection } from "@/components/admin/AdminLayout";
import type { getAdminOverview } from "@/lib/fns/admin";

type OverviewData = Awaited<ReturnType<typeof getAdminOverview>>;

type OverviewProps = {
  data: OverviewData;
  onNavigate: (section: AdminSection) => void;
};

const statusLabel: Record<string, string> = {
  paid: "Payé",
  pending: "En attente",
  manual_pending: "Paiement manuel",
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
  const { stats, content, recentRegistrations, affiliate } = data;
  const publicStudents = siteConfig.stats.studentsBase + stats.total;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Vue d&apos;ensemble de la plateforme BelKou — inscriptions, cours et revenus.
        </p>
      </div>

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
          label="Premium (inscrits)"
          value={stats.premium}
          icon={GraduationCap}
          onManage={() => onNavigate("students")}
        />
        <AdminStatCard
          label="VIP (inscrits)"
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
          label="Leçons sans vidéo"
          value={content.lessonsWithoutVideo}
          icon={VideoOff}
          highlight={content.lessonsWithoutVideo > 0}
          onManage={() => onNavigate("courses")}
        />
      </div>

      <div className="rounded-xl border border-border/70 bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <h2 className="font-display text-lg font-bold">Catalogue BelKou</h2>
            <p className="text-sm text-muted-foreground">
              {content.courseCount} cours · {content.totalLessons} leçons · {content.previewLessons} previews
              gratuites
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {content.courses.map((course) => (
                <span
                  key={course.slug}
                  className="inline-flex items-center rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium"
                >
                  {course.title}
                  {course.missingVimeo > 0 && (
                    <span className="ml-1.5 text-amber-600">({course.missingVimeo} sans Vimeo)</span>
                  )}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button variant="hero" size="sm" onClick={() => onNavigate("courses")}>
              Gérer les cours
            </Button>
            <Button variant="outline" size="sm" onClick={() => onNavigate("courses")}>
              Vidéos Vimeo
            </Button>
            <Button variant="outline" size="sm" onClick={() => onNavigate("inscriptions")}>
              Inscriptions
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3 text-sm">
          <div className="rounded-lg bg-muted/40 px-4 py-3">
            <p className="text-muted-foreground">Étudiants (compteur public)</p>
            <p className="mt-1 text-xl font-bold">{publicStudents}</p>
          </div>
          <div className="rounded-lg bg-muted/40 px-4 py-3">
            <p className="text-muted-foreground">En attente de paiement</p>
            <p className="mt-1 text-xl font-bold">{stats.pending + stats.manual_pending}</p>
          </div>
          <div className="rounded-lg bg-muted/40 px-4 py-3">
            <p className="text-muted-foreground">Prochaine cohorte</p>
            <p className="mt-1 text-xl font-bold">{siteConfig.cohortStartDate}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border/70 bg-card shadow-sm overflow-hidden">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-display text-lg font-bold">Activité récente</h2>
          <p className="text-sm text-muted-foreground">
            Dernières inscriptions sur la plateforme (réservé aux administrateurs).
          </p>
        </div>

        {recentRegistrations.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-muted-foreground">Aucune inscription pour le moment.</div>
        ) : (
          <ul className="divide-y divide-border">
            {recentRegistrations.map((row) => (
              <li key={row.id} className="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {row.full_name}{" "}
                    <span className="text-muted-foreground font-normal">
                      — {row.plan.toUpperCase()} · {statusLabel[row.payment_status] ?? row.payment_status}
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground truncate">{row.email}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground shrink-0">
                  <span>{row.country}</span>
                  <span>{formatActivityDate(row.created_at)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="border-t border-border bg-muted/20 px-6 py-3 flex flex-wrap gap-4 text-sm">
          <button
            type="button"
            onClick={() => onNavigate("inscriptions")}
            className="font-medium text-primary hover:underline"
          >
            Voir toutes les inscriptions →
          </button>
          <button
            type="button"
            onClick={() => onNavigate("commissions")}
            className="inline-flex items-center font-medium text-primary hover:underline"
          >
            <DollarSign className="h-3.5 w-3.5 mr-1" />
            Retraits affiliés ({affiliate.pendingWithdrawals}) →
          </button>
          <Link to="/courses" className="font-medium text-primary hover:underline">
            Site public →
          </Link>
        </div>
      </div>
    </div>
  );
}
