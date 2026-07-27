import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, CalendarClock, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FadeIn } from "@/components/motion/FadeIn";
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
      <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground shadow-sm">
        Chargement de vos cours…
      </div>
    );
  }

  if (enrollments.length === 0) {
    return (
      <section>
        <h2 className="font-display text-2xl font-semibold text-foreground">Mes cours</h2>
        <div className="mt-6 rounded-2xl border border-border bg-card p-10 text-center shadow-sm md:p-12">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10">
            <BookOpen className="h-7 w-7 text-primary" />
          </div>
          <h3 className="font-display text-lg font-semibold">Aucun cours pour le moment</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Parcourez le catalogue et inscrivez-vous à un cours pour commencer à apprendre.
          </p>
          <p className="mx-auto mt-4 max-w-md text-xs text-muted-foreground">
            Déjà inscrit ? Vérifiez que vous êtes connecté avec la même adresse email que celle utilisée
            lors du paiement.
          </p>
          <Button asChild variant="hero" className="mt-6 shadow-primary">
            <Link to="/courses">
              Explorer les cours <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    );
  }

  const count = filtered?.length ?? 0;

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-foreground">Mes cours</h2>
          <p className="mt-1 text-sm text-muted-foreground">Reprenez là où vous vous êtes arrêté.</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/courses">Catalogue</Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="h-11 w-full rounded-xl border-border lg:w-[200px]">
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
          <Input
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
          <span className="shrink-0 text-muted-foreground">Trier par</span>
          <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
            <SelectTrigger className="h-9 w-full rounded-xl border-border text-sm sm:w-[200px]">
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
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-10 text-center text-sm text-muted-foreground">
          Aucun cours ne correspond à votre recherche.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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
  const welcomeSearch = enrollment.welcomeLessonId ? { lesson: enrollment.welcomeLessonId } : undefined;
  const continueSearch = enrollment.continueLessonId ? { lesson: enrollment.continueLessonId } : undefined;
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

      <div className="flex min-w-0 flex-1 flex-col p-4">
        <div className="mb-2">
          <span
            className={cn(
              "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
              status === "active" && "bg-success/15 text-success",
              status === "scheduled" && "bg-primary/10 text-primary",
              status === "pending" && "bg-brand-accent/20 text-brand-accent-foreground",
            )}
          >
            {status === "active" ? "Actif" : status === "scheduled" ? "Programmé" : "En attente"}
          </span>
        </div>
        <Link {...href} className="block min-w-0">
          <h3 className="line-clamp-2 font-display text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
            {enrollment.courseTitle}
          </h3>
        </Link>
        <p className="mt-1 truncate text-xs text-muted-foreground">{enrollment.instructor}</p>

        <div className="mt-auto space-y-2 pt-4">
          {showProgress ? (
            <>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${Math.max(enrollment.progressPercent, 2)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{progressLabel(enrollment)}</p>
            </>
          ) : (
            <p
              className={cn(
                "flex items-center gap-1 text-xs",
                isPaid ? "text-primary" : "text-brand-accent-foreground",
              )}
            >
              {!isPaid ? null : !enrollment.contentLive ? (
                <CalendarClock className="h-3.5 w-3.5 shrink-0" />
              ) : null}
              {progressLabel(enrollment)}
            </p>
          )}
          <Button asChild size="sm" variant={canLearn || isPaid ? "default" : "outline"} className="w-full">
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
