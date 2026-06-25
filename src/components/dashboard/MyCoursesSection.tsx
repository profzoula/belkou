import { Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, CalendarClock, Clock, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseThumbnailBanner } from "@/components/course/CourseThumbnailBanner";
import { formatScheduledPublishLabel } from "@/lib/course-publish";
import type { StudentEnrollment } from "@/lib/fns/dashboard";
import { cn } from "@/lib/utils";

type MyCoursesSectionProps = {
  enrollments: StudentEnrollment[] | undefined;
};

function statusLabel(enrollment: StudentEnrollment) {
  if (enrollment.payment_status === "paid") {
    return enrollment.contentLive ? "Accès actif" : "Inscrit — vidéos bientôt";
  }
  if (enrollment.payment_status === "manual_pending") {
    return "Paiement manuel en attente";
  }
  return "Paiement en attente";
}

function statusClass(enrollment: StudentEnrollment) {
  if (enrollment.payment_status === "paid" && enrollment.contentLive) {
    return "bg-emerald-100 text-emerald-800";
  }
  if (enrollment.payment_status === "paid") {
    return "bg-sky-100 text-sky-800";
  }
  return "bg-amber-100 text-amber-800";
}

export function MyCoursesSection({ enrollments }: MyCoursesSectionProps) {
  if (enrollments === undefined) {
    return (
      <div className="surface rounded-2xl p-8 text-center text-sm text-muted-foreground">
        Chargement de vos cours...
      </div>
    );
  }

  if (enrollments.length === 0) {
    return (
      <section className="space-y-5">
        <div>
          <p className="section-label mb-2">Apprentissage</p>
          <h2 className="text-xl font-semibold">Mes cours</h2>
        </div>
        <div className="surface rounded-2xl p-8 md:p-10 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <BookOpen className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Aucun cours pour le moment</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            Parcourez le catalogue et inscrivez-vous à un cours pour commencer à apprendre.
          </p>
          <Button asChild variant="hero">
            <Link to="/courses">
              Voir les cours <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div>
        <p className="section-label mb-2">Apprentissage</p>
        <h2 className="text-xl font-semibold">Mes cours</h2>
      </div>

      <div className="grid gap-4">
        {enrollments.map((enrollment) => (
          <CourseEnrollmentCard key={enrollment.id} enrollment={enrollment} />
        ))}
      </div>
    </section>
  );
}

function CourseEnrollmentCard({ enrollment }: { enrollment: StudentEnrollment }) {
  const isPaid = enrollment.payment_status === "paid";
  const canLearn = isPaid && enrollment.contentLive;
  const scheduledLabel =
    enrollment.scheduledPublishAt && !enrollment.contentLive
      ? formatScheduledPublishLabel(enrollment.scheduledPublishAt)
      : null;

  return (
    <article className="surface rounded-2xl overflow-hidden flex flex-col sm:flex-row">
      <CourseThumbnailBanner
        thumbnail={{
          gradient: enrollment.thumbnailGradient,
          label: "",
          imageUrl: enrollment.thumbnailImageUrl,
        }}
        slug={enrollment.courseSlug}
        aspectClass="aspect-[16/10] sm:aspect-auto sm:w-56 sm:min-h-[148px]"
        className="sm:shrink-0"
        showLabel={false}
        showIcon={!enrollment.thumbnailImageUrl}
      />

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span
            className={cn(
              "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
              statusClass(enrollment),
            )}
          >
            {statusLabel(enrollment)}
          </span>
          {scheduledLabel && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5" />
              Vidéos le {scheduledLabel}
            </span>
          )}
        </div>

        <h3 className="text-lg font-semibold mb-1">{enrollment.courseTitle}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {isPaid
            ? canLearn
              ? "Continuez votre progression à votre rythme."
              : "Vous êtes inscrit. Les vidéos seront disponibles à la date indiquée."
            : enrollment.payment_status === "manual_pending"
              ? "Finalisez votre paiement manuel pour débloquer l'accès."
              : "Votre paiement n'est pas encore confirmé."}
        </p>

        <div className="mt-auto flex flex-wrap gap-2">
          {canLearn ? (
            <Button asChild variant="hero" size="sm">
              <Link to="/courses/$slug/learn" params={{ slug: enrollment.courseSlug }}>
                <Play className="h-4 w-4" />
                Continuer le cours
              </Link>
            </Button>
          ) : isPaid ? (
            <Button asChild variant="outline" size="sm">
              <Link to="/courses/$slug" params={{ slug: enrollment.courseSlug }}>
                Voir le cours
              </Link>
            </Button>
          ) : (
            <Button asChild variant="hero" size="sm">
              <Link to="/checkout" search={{ course: enrollment.courseSlug }}>
                <Clock className="h-4 w-4" />
                Finaliser le paiement
              </Link>
            </Button>
          )}
          {isPaid && (
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
              <Link to="/success" search={{ registrationId: enrollment.id }}>
                Confirmation
              </Link>
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
