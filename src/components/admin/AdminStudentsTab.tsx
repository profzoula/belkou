import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { BookOpenCheck, ChevronLeft, ChevronRight, GraduationCap, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adminGrantCourseAccess, getAdminStudents } from "@/lib/fns/admin";

const ROWS_PER_PAGE = 20;

const statusLabel: Record<string, string> = {
  paid: "Accès actif",
  pending: "Paiement en attente",
  manual_pending: "Paiement manuel",
};

const statusClass: Record<string, string> = {
  paid: "bg-emerald-500/10 text-emerald-700",
  pending: "bg-amber-500/10 text-amber-700",
  manual_pending: "bg-blue-500/10 text-blue-700",
};

type StudentsData = Awaited<ReturnType<typeof getAdminStudents>>;

export function AdminStudentsTab() {
  const studentsFn = useServerFn(getAdminStudents);
  const grantFn = useServerFn(adminGrantCourseAccess);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StudentsData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [accessFilter, setAccessFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [grantOpen, setGrantOpen] = useState(false);
  const [grantEmail, setGrantEmail] = useState("");
  const [grantName, setGrantName] = useState("");
  const [grantCourseSlug, setGrantCourseSlug] = useState("");
  const [granting, setGranting] = useState(false);
  const [actionEmail, setActionEmail] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const result = await studentsFn();
      setData(result);
      if (!grantCourseSlug && result.courses[0]) {
        setGrantCourseSlug(result.courses[0].slug);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Chargement impossible");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, accessFilter]);

  const courseTitleBySlug = useMemo(() => {
    const map = new Map<string, string>();
    for (const course of data?.courses ?? []) {
      map.set(course.slug, course.title);
    }
    return map;
  }, [data?.courses]);

  const filteredStudents = useMemo(() => {
    if (!data) return [];
    return data.students.filter((student) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !student.fullName.toLowerCase().includes(query) &&
          !student.email.toLowerCase().includes(query)
        ) {
          return false;
        }
      }
      if (accessFilter === "active" && student.paymentStatus !== "paid") return false;
      if (accessFilter === "none" && student.paymentStatus === "paid") return false;
      if (accessFilter === "pending" && student.paymentStatus !== "pending" && student.paymentStatus !== "manual_pending") {
        return false;
      }
      return true;
    });
  }, [data, searchQuery, accessFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / ROWS_PER_PAGE));
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return filteredStudents.slice(start, start + ROWS_PER_PAGE);
  }, [filteredStudents, currentPage]);

  const openGrantDialog = (student?: StudentsData["students"][number]) => {
    if (student) {
      setGrantEmail(student.email);
      setGrantName(student.fullName);
    } else {
      setGrantEmail("");
      setGrantName("");
    }
    setGrantOpen(true);
  };

  const submitGrant = async () => {
    if (!grantEmail.trim() || !grantCourseSlug) {
      toast.error("Email et cours requis");
      return;
    }

    const courseTitle = courseTitleBySlug.get(grantCourseSlug) ?? grantCourseSlug;
    if (
      !confirm(
        `Activer l'accès au cours « ${courseTitle} » pour ${grantEmail.trim()} ?`,
      )
    ) {
      return;
    }

    setGranting(true);
    setActionEmail(grantEmail.trim());
    try {
      const result = await grantFn({
        data: {
          email: grantEmail.trim(),
          courseSlug: grantCourseSlug,
          fullName: grantName.trim() || undefined,
        },
      });
      toast.success(`Cours activé — ${result.courseTitle} pour ${result.registration.email}`);
      setGrantOpen(false);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Activation impossible");
    } finally {
      setGranting(false);
      setActionEmail(null);
    }
  };

  if (loading || !data) {
    return (
      <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground shadow-sm">
        Chargement des étudiants...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Étudiants</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Comptes créés sur BelKou et accès aux cours. Activez un cours manuellement pour un étudiant.
          </p>
        </div>
        <Button variant="hero" size="sm" onClick={() => openGrantDialog()}>
          <BookOpenCheck className="h-4 w-4 mr-2" />
          Activer un cours
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Comptes étudiants</p>
          <p className="text-2xl font-semibold">{data.students.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Accès cours actif</p>
          <p className="text-2xl font-semibold">
            {data.students.filter((s) => s.paymentStatus === "paid").length}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Sans accès payé</p>
          <p className="text-2xl font-semibold">
            {data.students.filter((s) => s.paymentStatus !== "paid").length}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-border flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher nom ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-lg pl-9"
            />
          </div>
          <Select value={accessFilter} onValueChange={setAccessFilter}>
            <SelectTrigger className="rounded-lg w-full sm:w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="active">Accès actif</SelectItem>
              <SelectItem value="pending">Paiement en attente</SelectItem>
              <SelectItem value="none">Sans accès payé</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="table-scroll hidden md:block">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-5 py-3">Inscrit le</th>
                <th className="px-5 py-3">Nom</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Cours</th>
                <th className="px-5 py-3">Statut</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                    Aucun étudiant trouvé.
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((student) => (
                  <tr key={student.registrationId ?? `${student.userId}-${student.email}`} className="border-b border-border/60">
                    <td className="px-5 py-3 text-muted-foreground">
                      {new Date(student.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-5 py-3 font-medium">{student.fullName}</td>
                    <td className="px-5 py-3">{student.email}</td>
                    <td className="px-5 py-3">
                      {student.courseSlug && student.paymentStatus === "paid" ? (
                        <span className="line-clamp-2">
                          {courseTitleBySlug.get(student.courseSlug) ?? student.courseSlug}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {student.paymentStatus ? (
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${statusClass[student.paymentStatus] ?? ""}`}
                        >
                          {statusLabel[student.paymentStatus] ?? student.paymentStatus}
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                          Compte seul
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {student.paymentStatus === "paid" && student.courseSlug ? (
                        <div className="flex flex-col items-start gap-1.5">
                          <span className="text-xs font-medium text-emerald-700">Accès confirmé</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto px-0 text-xs text-muted-foreground hover:text-foreground"
                            disabled={granting && actionEmail === student.email}
                            onClick={() => openGrantDialog(student)}
                          >
                            Activer un autre cours
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          disabled={granting && actionEmail === student.email}
                          onClick={() => openGrantDialog(student)}
                        >
                          <GraduationCap className="h-3.5 w-3.5 mr-1.5" />
                          Activer cours
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="md:hidden divide-y divide-border">
          {paginatedStudents.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">Aucun étudiant trouvé.</p>
          ) : (
            paginatedStudents.map((student) => (
              <div key={student.registrationId ?? `${student.userId}-${student.email}`} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{student.fullName}</p>
                    <p className="text-sm text-muted-foreground truncate">{student.email}</p>
                  </div>
                  {student.paymentStatus ? (
                    <span
                      className={`shrink-0 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${statusClass[student.paymentStatus] ?? ""}`}
                    >
                      {statusLabel[student.paymentStatus] ?? student.paymentStatus}
                    </span>
                  ) : (
                    <span className="shrink-0 inline-flex rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      Compte seul
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  Inscrit le {new Date(student.createdAt).toLocaleDateString("fr-FR")}
                </div>
                {student.courseSlug && student.paymentStatus === "paid" && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Cours : </span>
                    {courseTitleBySlug.get(student.courseSlug) ?? student.courseSlug}
                  </p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  disabled={granting && actionEmail === student.email}
                  onClick={() => openGrantDialog(student)}
                >
                  <GraduationCap className="h-3.5 w-3.5 mr-1.5" />
                  {student.paymentStatus === "paid" && student.courseSlug
                    ? "Activer un autre cours"
                    : "Activer un cours"}
                </Button>
              </div>
            ))
          )}
        </div>

        {filteredStudents.length > ROWS_PER_PAGE && (
          <div className="px-5 py-3 border-t flex justify-between items-center text-sm">
            <span className="text-xs text-muted-foreground">
              Page {currentPage} / {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={grantOpen} onOpenChange={setGrantOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Activer un cours pour un étudiant</DialogTitle>
            <DialogDescription>
              L&apos;étudiant verra le cours dans « Mes cours » et pourra y accéder immédiatement
              (si les vidéos sont disponibles).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="grant-email">Email de l&apos;étudiant</Label>
              <Input
                id="grant-email"
                type="email"
                value={grantEmail}
                onChange={(e) => setGrantEmail(e.target.value)}
                placeholder="etudiant@email.com"
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grant-name">Nom (optionnel)</Label>
              <Input
                id="grant-name"
                value={grantName}
                onChange={(e) => setGrantName(e.target.value)}
                placeholder="Nom affiché"
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label>Cours à activer</Label>
              <Select value={grantCourseSlug} onValueChange={setGrantCourseSlug}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue placeholder="Choisir un cours" />
                </SelectTrigger>
                <SelectContent>
                  {data.courses.map((course) => (
                    <SelectItem key={course.slug} value={course.slug}>
                      {course.title}
                      {!course.published ? " (brouillon)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setGrantOpen(false)}>
              Annuler
            </Button>
            <Button variant="hero" disabled={granting} onClick={submitGrant}>
              {granting ? "Activation..." : "Activer l'accès"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
