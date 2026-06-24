import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { BookOpen, DollarSign, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site-config";
import { getAdminCourses } from "@/lib/fns/admin";
import type { AdminSection } from "@/components/admin/AdminLayout";

type OverviewProps = {
  stats: {
    total: number;
    paid: number;
    premium: number;
    vip: number;
  };
  onNavigate: (section: AdminSection) => void;
};

export function AdminOverviewTab({ stats, onNavigate }: OverviewProps) {
  const loadCoursesFn = useServerFn(getAdminCourses);
  const [courseCount, setCourseCount] = useState(1);
  const [lessonCount, setLessonCount] = useState(0);

  useEffect(() => {
    loadCoursesFn()
      .then((result) => {
        setCourseCount(result.courses.length);
        setLessonCount(
          result.courses.reduce(
            (sum, course) => sum + course.sections.reduce((s, sec) => s + sec.lessons.length, 0),
            0,
          ),
        );
      })
      .catch(() => {});
  }, [loadCoursesFn]);

  const publicStudents = siteConfig.stats.studentsBase + stats.total;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Vue d&apos;ensemble</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gérez inscriptions, cours Vimeo, commissions et paramètres du site.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Inscriptions", value: stats.total },
          { label: "Payées", value: stats.paid },
          { label: "Premium", value: stats.premium },
          { label: "VIP", value: stats.vip },
        ].map((item) => (
          <div key={item.label} className="surface rounded-xl p-5">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="mt-1 text-3xl font-bold">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="surface rounded-xl p-5 lg:col-span-2">
          <h2 className="font-semibold">Accès rapide</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" onClick={() => onNavigate("inscriptions")}>
              <Users className="h-5 w-5 text-primary" />
              Inscriptions
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" onClick={() => onNavigate("courses")}>
              <BookOpen className="h-5 w-5 text-primary" />
              Cours & vidéos
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" onClick={() => onNavigate("commissions")}>
              <DollarSign className="h-5 w-5 text-primary" />
              Commissions
            </Button>
          </div>
        </div>

        <div className="surface rounded-xl p-5 space-y-3 text-sm">
          <h2 className="font-semibold">Résumé contenu</h2>
          <p>
            <span className="text-muted-foreground">Cours publiés :</span>{" "}
            <strong>{courseCount}</strong>
          </p>
          <p>
            <span className="text-muted-foreground">Leçons totales :</span>{" "}
            <strong>{lessonCount}</strong>
          </p>
          <p>
            <span className="text-muted-foreground">Compteur public :</span>{" "}
            <strong>{publicStudents}</strong> étudiants
          </p>
          <p>
            <span className="text-muted-foreground">Cohorte :</span>{" "}
            <strong>{siteConfig.cohortStartDate}</strong>
          </p>
        </div>
      </div>

      <div className="surface rounded-xl p-5">
        <h2 className="font-semibold text-sm mb-2">Liens utiles</h2>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link to="/courses" className="text-primary hover:underline">
            Voir les cours (public)
          </Link>
          <Link to="/" className="text-primary hover:underline">
            Page d&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
