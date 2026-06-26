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
import { CourseThumbnailBanner } from "@/components/course/CourseThumbnailBanner";
import { formatScheduledPublishLabel } from "@/lib/course-publish";
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
    return "Commencer le cours";
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
      <div className="rounded-lg border border-border bg-card p-10 text-center text-sm text-muted-foreground">
        Chargement de vos cours...
      </div>
    );
  }

  if (enrollments.length === 0) {
    return (
      <section>
        <h2 className="text-2xl font-bold text-foreground mb-6">Mes cours</h2>
        <div className="rounded-lg border border-border bg-card p-10 md:p-12 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-muted">
            <BookOpen className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold mb-2">Aucun cours pour le moment</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            Parcourez le catalogue et inscrivez-vous à un cours pour commencer à apprendre.
          </p>
          <Button asChild variant="hero" className="rounded-md">
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
      <h2 className="text-2xl font-bold text-foreground">Mes cours</h2>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-full lg:w-[180px] rounded-md border-border h-11">
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
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher dans mes cours"
            className="h-11 rounded-md pr-12"
          />
          <button
            type="button"
            className="absolute right-1 top-1 grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground"
            aria-label="Rechercher"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm">
        <p className="font-semibold text-foreground">
          {count} cours
        </p>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground shrink-0">Trier par :</span>
          <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
            <SelectTrigger className="w-full sm:w-[200px] rounded-md border-border h-9 text-sm">
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
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-10 text-center text-sm text-muted-foreground">
          Aucun cours ne correspond à votre recherche.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
          {filtered?.map((enrollment) => (
            <CourseGridCard key={enrollment.id} enrollment={enrollment} />
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
  const href = canLearn
    ? { to: "/courses/$slug/learn" as const, params: { slug: enrollment.courseSlug } }
    : isPaid
      ? {
          to: "/courses/$slug/learn" as const,
          params: { slug: enrollment.courseSlug },
          ...(welcomeSearch ? { search: welcomeSearch } : {}),
        }
      : { to: "/checkout" as const, search: { course: enrollment.courseSlug } };

  const showProgress = isPaid && enrollment.contentLive;

  return (
    <article className="group flex flex-col min-w-0">
      <Link
        {...href}
        className="block overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
      >
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

      <div className="pt-3 flex flex-col flex-1 min-w-0">
        <Link {...href} className="block min-w-0">
          <h3 className="font-bold text-sm leading-snug text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {enrollment.courseTitle}
          </h3>
        </Link>
        <p className="text-xs text-muted-foreground mt-1 truncate">{enrollment.instructor}</p>

        <div className="mt-3 space-y-1.5">
          {showProgress ? (
            <>
              <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
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
                "text-xs flex items-center gap-1",
                isPaid ? "text-sky-700" : "text-amber-700",
              )}
            >
              {!isPaid ? null : !enrollment.contentLive ? (
                <CalendarClock className="h-3.5 w-3.5 shrink-0" />
              ) : null}
              {progressLabel(enrollment)}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
