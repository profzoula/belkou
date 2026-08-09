import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, CalendarClock, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FadeIn } from "@/components/motion/FadeIn";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel } from "@/components/ui/panel";
import { CourseThumbnailBanner } from "@/components/course/CourseThumbnailBanner";
import { formatScheduledPublishLabel } from "@/lib/course-publish";
import { getCourseActionLabel } from "@/lib/courses";
import type { StudentEnrollment } from "@/lib/fns/dashboard";
import { cn } from "@/lib/utils";

type MyCoursesSectionProps = {
  enrollments: StudentEnrollment[] | undefined;
};

type StatusFilter = "all" | "active" | "scheduled" | "pending";
type SortOption = "recent" | "title";

function enrollmentStatus(enrollment: StudentEnrollment): StatusFilter {
  if (enrollment.payment_status !== "paid") return "pending";
  if (enrollment.contentLive) return "active";
  return "scheduled";
}

function progressLabel(enrollment: StudentEnrollment) {
  if (enrollment.payment_status !== "paid") {
    return enrollment.payment_status === "manual_pending"
      ? "Paiement manuel en attente"
      : "Paiement en attente";
  }
  if (!enrollment.contentLive && enrollment.scheduledPublishAt) {
    return enrollment.welcomeLessonId
      ? "Vidéo de bienvenue disponible"
      : `Disponible le ${formatScheduledPublishLabel(enrollment.scheduledPublishAt)}`;
  }
  if (enrollment.progressPercent <= 0) {
    return getCourseActionLabel(0);
  }
  return `${enrollment.progressPercent}% terminé`;
}

export function MyCoursesSection({ enrollments }: MyCoursesSectionProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortOption>("recent");

  const filtered = useMemo(() => {
    if (!enrollments) return undefined;

    const query = search.trim().toLowerCase();
    let list = enrollments.filter((enrollment) => {
      if (statusFilter !== "all" && enrollmentStatus(enrollment) !== statusFilter) {
        return false;
      }
      if (!query) return true;
      return (
        enrollment.courseTitle.toLowerCase().includes(query) ||
        enrollment.instructor.toLowerCase().includes(query)
      );
    });

    list = [...list].sort((a, b) => {
      if (sort === "title") {
        return a.courseTitle.localeCompare(b.courseTitle, "fr");
      }
      return Date.parse(b.purchasedAt) - Date.parse(a.purchasedAt);
    });

    return list;
  }, [enrollments, search, statusFilter, sort]);

  if (enrollments === undefined) {
    return (
      <Panel
        padding="lg"
        className="text-center text-sm text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        Chargement de vos cours…
      </Panel>
    );
  }

  if (enrollments.length === 0) {
    return (
      <section>
        <h2 className="font-display text-2xl font-semibold text-foreground">Mes cours</h2>
        <Panel className="mt-6">
          <EmptyState
            icon={BookOpen}
            title="Aucun cours pour le moment"
            description="Parcourez le catalogue et inscrivez-vous à un cours pour commencer à apprendre. Déjà inscrit ? Vérifiez que vous êtes connecté avec la même adresse email que celle utilisée lors du paiement."
            action={
              <Button asChild variant="hero">
                <Link to="/courses">
                  Explorer les cours <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            }
          />
        </Panel>
      </section>
    );
  }

  const count = filtered?.length ?? 0;

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-foreground">Mes cours</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Reprenez là où vous vous êtes arrêté.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/courses">Catalogue</Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <Label className="sr-only" htmlFor="courses-status-filter">
          Filtrer mes cours par statut
        </Label>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger
            id="courses-status-filter"
            className="h-11 w-full rounded-xl border-border lg:w-[200px]"
          >
            <SelectValue placeholder="Progression" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les cours</SelectItem>
            <SelectItem value="active">Accès actif</SelectItem>
            <SelectItem value="scheduled">Bientôt disponible</SelectItem>
            <SelectItem value="pending">Paiement en attente</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Label className="sr-only" htmlFor="courses-search">
            Rechercher dans mes cours
          </Label>
          <Input
            id="courses-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher dans mes cours"
            className="h-11 rounded-xl pl-10"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="font-semibold text-foreground">{count} cours</p>
        <div className="flex items-center gap-2">
          <Label className="shrink-0 text-muted-foreground" htmlFor="courses-sort">
            Trier par
          </Label>
          <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
            <SelectTrigger
              id="courses-sort"
              className="h-9 w-full rounded-xl border-border text-sm sm:w-[200px]"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Récemment inscrit</SelectItem>
              <SelectItem value="title">Titre (A–Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {count === 0 ? (
        <Panel variant="dashed">
          <EmptyState
            title="Aucun résultat"
            description="Aucun cours ne correspond à votre recherche."
          />
        </Panel>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered?.map((enrollment, index) => (
            <FadeIn key={enrollment.id} delay={Math.min(index * 0.04, 0.2)}>
              <CourseGridCard enrollment={enrollment} />
            </FadeIn>
          ))}
        </div>
      )}
    </section>
  );
}

function CourseGridCard({ enrollment }: { enrollment: StudentEnrollment }) {
  const isPaid = enrollment.payment_status === "paid";
  const canLearn = isPaid && enrollment.contentLive;
  const welcomeSearch = enrollment.welcomeLessonId
    ? { lesson: enrollment.welcomeLessonId }
    : undefined;
  const continueSearch = enrollment.continueLessonId
    ? { lesson: enrollment.continueLessonId }
    : undefined;
  const href = canLearn
    ? {
        to: "/courses/$slug/learn" as const,
        params: { slug: enrollment.courseSlug },
        ...(continueSearch ? { search: continueSearch } : {}),
      }
    : isPaid
      ? {
          to: "/courses/$slug/learn" as const,
          params: { slug: enrollment.courseSlug },
          ...(welcomeSearch ? { search: welcomeSearch } : {}),
        }
      : { to: "/checkout" as const, search: { course: enrollment.courseSlug } };

  const showProgress = isPaid && enrollment.contentLive;
  const status = enrollmentStatus(enrollment);

  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md">
      <Link {...href} className="block overflow-hidden">
        <CourseThumbnailBanner
          thumbnail={{
            gradient: enrollment.thumbnailGradient,
            label: "",
            imageUrl: enrollment.thumbnailImageUrl,
          }}
          slug={enrollment.courseSlug}
          aspectClass="aspect-[16/10]"
          className="rounded-none border-0"
          showLabel={false}
          showIcon={!enrollment.thumbnailImageUrl}
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col p-2.5 sm:p-4">
        <div className="mb-1.5 sm:mb-2">
          <Badge
            variant={
              status === "active" ? "success" : status === "scheduled" ? "secondary" : "warning"
            }
            className="text-[9px] uppercase tracking-wide sm:text-[10px]"
          >
            {status === "active" ? "Actif" : status === "scheduled" ? "Programmé" : "En attente"}
          </Badge>
        </div>
        <Link {...href} className="block min-w-0">
          <h3 className="line-clamp-2 font-display text-xs font-semibold leading-snug text-foreground transition-colors group-hover:text-primary sm:text-sm">
            {enrollment.courseTitle}
          </h3>
        </Link>
        <p className="mt-1 truncate text-[10px] text-muted-foreground sm:text-xs">
          {enrollment.instructor}
        </p>

        <div className="mt-auto space-y-2 pt-3 sm:pt-4">
          {showProgress ? (
            <>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.max(enrollment.progressPercent, 0)}
                  aria-label={`Progression ${enrollment.courseTitle}`}
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${Math.max(enrollment.progressPercent, 2)}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground sm:text-xs">
                {progressLabel(enrollment)}
              </p>
            </>
          ) : (
            <p
              className={cn(
                "flex items-center gap-1 text-[10px] sm:text-xs",
                isPaid ? "text-primary" : "text-brand-accent-foreground",
              )}
            >
              {!isPaid ? null : !enrollment.contentLive ? (
                <CalendarClock className="h-3.5 w-3.5 shrink-0" />
              ) : null}
              {progressLabel(enrollment)}
            </p>
          )}
          <Button
            asChild
            size="sm"
            variant={canLearn || isPaid ? "default" : "outline"}
            className="h-8 w-full text-xs sm:h-9 sm:text-sm"
          >
            <Link {...href}>
              {canLearn ? "Continuer" : isPaid ? "Ouvrir" : "Finaliser"}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
