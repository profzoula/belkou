import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  ExternalLink,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  getAdminCourseTab,
  type AdminCourse,
  type AdminCourseTab,
} from "@/lib/admin-courses";
import { AdminCourseThumbnailEditor } from "@/components/admin/AdminCourseThumbnailEditor";
import { CourseThumbnailBanner } from "@/components/course/CourseThumbnailBanner";
import {
  adminAddLesson,
  adminAddSection,
  adminCreateCourse,
  adminDeleteCourse,
  adminDeleteLesson,
  adminSetCoursePublished,
  adminUpdateCourse,
  adminUpdateLesson,
  getAdminCourses,
} from "@/lib/fns/admin";
import { slugifyTitle } from "@/lib/course-storage";
import { cn } from "@/lib/utils";

type LessonDraft = {
  title: string;
  duration: string;
  vimeo: string;
  preview: boolean;
};

type CourseMetaDraft = {
  title: string;
  description: string;
  instructor: string;
  price: string;
  originalPrice: string;
  plan: "premium" | "vip";
  skillLevel: string;
  totalDuration: string;
  bestseller: boolean;
  thumbnailLabel: string;
  thumbnailGradient: string;
  thumbnailImageUrl: string;
};

type NewLessonDraft = {
  title: string;
  duration: string;
  vimeo: string;
  preview: boolean;
};

const tabLabels: Record<AdminCourseTab, string> = {
  published: "Publiés",
  hidden: "Masqués",
  draft: "En préparation",
};

function lessonToDraft(lesson: AdminCourse["sections"][number]["lessons"][number]): LessonDraft {
  return {
    title: lesson.title,
    duration: lesson.duration,
    vimeo: lesson.vimeo ?? "",
    preview: Boolean(lesson.preview),
  };
}

function courseToMetaDraft(course: AdminCourse): CourseMetaDraft {
  return {
    title: course.title,
    description: course.description,
    instructor: course.instructor,
    price: String(course.price),
    originalPrice: String(course.originalPrice),
    plan: course.plan ?? "premium",
    skillLevel: course.skillLevel,
    totalDuration: course.totalDuration,
    bestseller: Boolean(course.bestseller),
    thumbnailLabel: course.thumbnail.label,
    thumbnailGradient: course.thumbnail.gradient,
    thumbnailImageUrl: course.thumbnail.imageUrl ?? "",
  };
}

const emptyNewLesson = (): NewLessonDraft => ({
  title: "",
  duration: "5min",
  vimeo: "",
  preview: false,
});

function planBadge(plan: AdminCourse["plan"], isBase: boolean) {
  if (isBase) return "Base";
  return plan === "vip" ? "VIP" : "Premium";
}

export function AdminCoursesTab() {
  const loadFn = useServerFn(getAdminCourses);
  const saveLessonFn = useServerFn(adminUpdateLesson);
  const saveCourseFn = useServerFn(adminUpdateCourse);
  const publishFn = useServerFn(adminSetCoursePublished);
  const addLessonFn = useServerFn(adminAddLesson);
  const addSectionFn = useServerFn(adminAddSection);
  const deleteLessonFn = useServerFn(adminDeleteLesson);
  const createFn = useServerFn(adminCreateCourse);
  const deleteFn = useServerFn(adminDeleteCourse);

  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [view, setView] = useState<"catalog" | "edit">("catalog");
  const [activeTab, setActiveTab] = useState<AdminCourseTab>("published");
  const [search, setSearch] = useState("");
  const [selectedSlug, setSelectedSlug] = useState("");
  const [drafts, setDrafts] = useState<Record<string, LessonDraft>>({});
  const [metaDraft, setMetaDraft] = useState<CourseMetaDraft | null>(null);
  const [newLessonBySection, setNewLessonBySection] = useState<Record<string, NewLessonDraft>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savingMeta, setSavingMeta] = useState(false);
  const [togglingSlug, setTogglingSlug] = useState<string | null>(null);
  const [addingSectionId, setAddingSectionId] = useState<string | null>(null);
  const [addingSession, setAddingSession] = useState(false);
  const [deletingLessonId, setDeletingLessonId] = useState<string | null>(null);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPlan, setNewPlan] = useState<"premium" | "vip">("premium");
  const [slugEdited, setSlugEdited] = useState(false);

  const syncDrafts = (list: AdminCourse[]) => {
    const nextDrafts: Record<string, LessonDraft> = {};
    for (const course of list) {
      for (const section of course.sections) {
        for (const lesson of section.lessons) {
          nextDrafts[`${course.slug}:${lesson.id}`] = lessonToDraft(lesson);
        }
      }
    }
    setDrafts(nextDrafts);
  };

  const load = async () => {
    setLoading(true);
    try {
      const result = await loadFn();
      setCourses(result.courses);
      syncDrafts(result.courses);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const tabCounts = useMemo(() => {
    const counts: Record<AdminCourseTab, number> = { published: 0, hidden: 0, draft: 0 };
    for (const course of courses) {
      counts[getAdminCourseTab(course)] += 1;
    }
    return counts;
  }, [courses]);

  const filteredCourses = useMemo(() => {
    const query = search.trim().toLowerCase();
    return courses.filter((course) => {
      if (getAdminCourseTab(course) !== activeTab) return false;
      if (!query) return true;
      return (
        course.title.toLowerCase().includes(query) ||
        course.slug.toLowerCase().includes(query)
      );
    });
  }, [courses, activeTab, search]);

  const selectedCourse = useMemo(
    () => courses.find((course) => course.slug === selectedSlug),
    [courses, selectedSlug],
  );

  useEffect(() => {
    if (selectedCourse) {
      setMetaDraft(courseToMetaDraft(selectedCourse));
    } else {
      setMetaDraft(null);
    }
  }, [selectedCourse]);

  const openEditor = (slug: string) => {
    setSelectedSlug(slug);
    setView("edit");
  };

  const togglePublished = async (course: AdminCourse, published: boolean) => {
    setTogglingSlug(course.slug);
    try {
      const result = await publishFn({
        data: { courseSlug: course.slug, published },
      });
      setCourses(result.courses);
      syncDrafts(result.courses);
      toast.success(published ? "Cours publié" : "Cours masqué");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Mise à jour impossible");
    } finally {
      setTogglingSlug(null);
    }
  };

  const updateDraft = (courseSlug: string, lessonId: string, patch: Partial<LessonDraft>) => {
    const key = `${courseSlug}:${lessonId}`;
    setDrafts((current) => ({
      ...current,
      [key]: { ...current[key], ...patch },
    }));
  };

  const updateMetaDraft = (patch: Partial<CourseMetaDraft>) => {
    setMetaDraft((current) => (current ? { ...current, ...patch } : current));
  };

  const getNewLessonDraft = (sectionId: string): NewLessonDraft =>
    newLessonBySection[sectionId] ?? emptyNewLesson();

  const updateNewLessonDraft = (sectionId: string, patch: Partial<NewLessonDraft>) => {
    setNewLessonBySection((current) => ({
      ...current,
      [sectionId]: { ...getNewLessonDraft(sectionId), ...patch },
    }));
  };

  const saveLesson = async (courseSlug: string, lessonId: string) => {
    const key = `${courseSlug}:${lessonId}`;
    const draft = drafts[key];
    if (!draft) return;

    setSavingId(key);
    try {
      const result = await saveLessonFn({
        data: {
          courseSlug,
          lessonId,
          title: draft.title,
          duration: draft.duration,
          vimeo: draft.vimeo || undefined,
          preview: draft.preview,
        },
      });
      setCourses(result.courses);
      syncDrafts(result.courses);
      toast.success("Leçon enregistrée");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sauvegarde impossible");
    } finally {
      setSavingId(null);
    }
  };

  const saveCourseMeta = async () => {
    if (!selectedCourse || !metaDraft) return;

    setSavingMeta(true);
    try {
      const price = Number(metaDraft.price);
      const originalPrice = Number(metaDraft.originalPrice);
      if (Number.isNaN(price) || Number.isNaN(originalPrice)) {
        toast.error("Prix invalides");
        return;
      }

      const result = await saveCourseFn({
        data: {
          courseSlug: selectedCourse.slug,
          title: metaDraft.title.trim(),
          description: metaDraft.description,
          instructor: metaDraft.instructor.trim(),
          price,
          originalPrice,
          plan: metaDraft.plan,
          skillLevel: metaDraft.skillLevel.trim(),
          totalDuration: metaDraft.totalDuration.trim(),
          bestseller: metaDraft.bestseller,
          thumbnailLabel: metaDraft.thumbnailLabel.trim(),
          thumbnailGradient: metaDraft.thumbnailGradient.trim(),
          thumbnailImageUrl: metaDraft.thumbnailImageUrl.trim() || undefined,
        },
      });
      setCourses(result.courses);
      syncDrafts(result.courses);
      toast.success("Informations du cours enregistrées");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sauvegarde impossible");
    } finally {
      setSavingMeta(false);
    }
  };

  const addLesson = async (sectionId: string) => {
    if (!selectedCourse) return;
    const draft = getNewLessonDraft(sectionId);
    if (!draft.title.trim()) {
      toast.error("Titre de la vidéo requis");
      return;
    }

    setAddingSectionId(sectionId);
    try {
      const result = await addLessonFn({
        data: {
          courseSlug: selectedCourse.slug,
          sectionId,
          title: draft.title.trim(),
          duration: draft.duration.trim() || undefined,
          vimeo: draft.vimeo.trim() || undefined,
          preview: draft.preview,
        },
      });
      setCourses(result.courses);
      syncDrafts(result.courses);
      setNewLessonBySection((current) => ({ ...current, [sectionId]: emptyNewLesson() }));
      toast.success("Vidéo ajoutée");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ajout impossible");
    } finally {
      setAddingSectionId(null);
    }
  };

  const addSection = async () => {
    if (!selectedCourse) return;
    if (!newSectionTitle.trim()) {
      toast.error("Titre de la session requis");
      return;
    }

    setAddingSession(true);
    try {
      const result = await addSectionFn({
        data: {
          courseSlug: selectedCourse.slug,
          title: newSectionTitle.trim(),
        },
      });
      setCourses(result.courses);
      syncDrafts(result.courses);
      setNewSectionTitle("");
      toast.success("Session ajoutée");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ajout impossible");
    } finally {
      setAddingSession(false);
    }
  };

  const deleteLesson = async (lessonId: string, lessonTitle: string) => {
    if (!selectedCourse) return;
    if (!window.confirm(`Supprimer la leçon « ${lessonTitle} » ?`)) return;

    setDeletingLessonId(lessonId);
    try {
      const result = await deleteLessonFn({
        data: {
          courseSlug: selectedCourse.slug,
          lessonId,
        },
      });
      setCourses(result.courses);
      syncDrafts(result.courses);
      toast.success("Leçon supprimée");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Suppression impossible");
    } finally {
      setDeletingLessonId(null);
    }
  };

  const handleTitleChange = (value: string) => {
    setNewTitle(value);
    if (!slugEdited) {
      setNewSlug(slugifyTitle(value));
    }
  };

  const createCourse = async () => {
    if (!newTitle.trim() || !newSlug.trim()) {
      toast.error("Titre et slug requis");
      return;
    }

    setCreating(true);
    try {
      const result = await createFn({
        data: {
          title: newTitle.trim(),
          slug: newSlug.trim(),
          description: newDescription.trim() || undefined,
          plan: newPlan,
        },
      });
      setCourses(result.courses);
      setShowCreateForm(false);
      setNewTitle("");
      setNewSlug("");
      setNewDescription("");
      setNewPlan("premium");
      setSlugEdited(false);
      setActiveTab("draft");
      toast.success(`Cours créé — aperçu : /courses/${result.createdSlug}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Création impossible");
    } finally {
      setCreating(false);
    }
  };

  const deleteCourse = async () => {
    if (!selectedCourse || selectedCourse.isBase) return;
    if (!window.confirm(`Supprimer « ${selectedCourse.title} » ?`)) return;

    setDeleting(true);
    try {
      const result = await deleteFn({ data: { slug: selectedCourse.slug } });
      setCourses(result.courses);
      setView("catalog");
      setSelectedSlug("");
      syncDrafts(result.courses);
      toast.success("Cours supprimé");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Suppression impossible");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground shadow-sm">
        Chargement du catalogue...
      </div>
    );
  }

  if (view === "edit" && selectedCourse && metaDraft) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setView("catalog")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Catalogue
            </Button>
            <div>
              <h1 className="font-display text-xl font-bold">{selectedCourse.title}</h1>
              <p className="text-sm text-muted-foreground">{selectedCourse.slug}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/courses/$slug" params={{ slug: selectedCourse.slug }} target="_blank">
                <ExternalLink className="h-4 w-4 mr-2" />
                Voir sur le site
              </Link>
            </Button>
            {!selectedCourse.isBase && (
              <Button variant="destructive" size="sm" disabled={deleting} onClick={deleteCourse}>
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border/70 bg-card p-4 space-y-4 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-semibold">Informations du cours</h2>
            <Button variant="hero" size="sm" disabled={savingMeta} onClick={saveCourseMeta}>
              <Save className="h-4 w-4 mr-2" />
              {savingMeta ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="meta-title">Titre du cours</Label>
              <Input
                id="meta-title"
                value={metaDraft.title}
                onChange={(e) => updateMetaDraft({ title: e.target.value })}
                className="rounded-lg"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="meta-desc">Description</Label>
              <Textarea
                id="meta-desc"
                value={metaDraft.description}
                onChange={(e) => updateMetaDraft({ description: e.target.value })}
                className="rounded-lg min-h-[88px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="meta-instructor">Instructeur</Label>
              <Input
                id="meta-instructor"
                value={metaDraft.instructor}
                onChange={(e) => updateMetaDraft({ instructor: e.target.value })}
                className="rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="meta-duration">Durée totale</Label>
              <Input
                id="meta-duration"
                value={metaDraft.totalDuration}
                onChange={(e) => updateMetaDraft({ totalDuration: e.target.value })}
                className="rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="meta-price">Prix ($)</Label>
              <Input
                id="meta-price"
                type="number"
                min={0}
                value={metaDraft.price}
                onChange={(e) => updateMetaDraft({ price: e.target.value })}
                className="rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Plan</Label>
              <Select
                value={metaDraft.plan}
                onValueChange={(v) => updateMetaDraft({ plan: v as "premium" | "vip" })}
              >
                <SelectTrigger className="rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <AdminCourseThumbnailEditor
          slug={selectedCourse.slug}
          value={{
            label: metaDraft.thumbnailLabel,
            gradient: metaDraft.thumbnailGradient,
            imageUrl: metaDraft.thumbnailImageUrl || undefined,
          }}
          onChange={(patch) =>
            updateMetaDraft({
              ...(patch.label !== undefined && { thumbnailLabel: patch.label }),
              ...(patch.gradient !== undefined && { thumbnailGradient: patch.gradient }),
              ...(patch.imageUrl !== undefined && { thumbnailImageUrl: patch.imageUrl }),
            })
          }
        />

        <Accordion
          type="multiple"
          key={selectedCourse.sections.map((s) => s.id).join("-")}
          defaultValue={selectedCourse.sections.map((s) => s.id)}
          className="space-y-3"
        >
          {selectedCourse.sections.map((section) => {
            const newLesson = getNewLessonDraft(section.id);
            return (
              <AccordionItem key={section.id} value={section.id} className="rounded-xl border border-border bg-card px-4">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="text-left">
                    <p className="font-semibold">{section.title}</p>
                    <p className="text-xs text-muted-foreground">{section.lessons.length} leçons</p>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4 space-y-4">
                  {section.lessons.map((lesson, index) => {
                    const key = `${selectedCourse.slug}:${lesson.id}`;
                    const draft = drafts[key] ?? lessonToDraft(lesson);
                    return (
                      <div key={lesson.id} className="rounded-lg border border-border p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold">
                            {index + 1}. {lesson.title}
                          </p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 text-destructive hover:text-destructive shrink-0"
                            disabled={deletingLessonId === lesson.id}
                            onClick={() => deleteLesson(lesson.id, lesson.title)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            {deletingLessonId === lesson.id ? "..." : "Supprimer"}
                          </Button>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1.5 sm:col-span-2">
                            <Label>Titre</Label>
                            <Input
                              value={draft.title}
                              onChange={(e) =>
                                updateDraft(selectedCourse.slug, lesson.id, { title: e.target.value })
                              }
                              className="rounded-lg"
                            />
                          </div>
                          {lesson.type === "video" && (
                            <>
                              <div className="space-y-1.5">
                                <Label>Durée</Label>
                                <Input
                                  value={draft.duration}
                                  onChange={(e) =>
                                    updateDraft(selectedCourse.slug, lesson.id, { duration: e.target.value })
                                  }
                                  className="rounded-lg"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label>Vimeo</Label>
                                <Input
                                  value={draft.vimeo}
                                  onChange={(e) =>
                                    updateDraft(selectedCourse.slug, lesson.id, { vimeo: e.target.value })
                                  }
                                  className="rounded-lg"
                                />
                              </div>
                            </>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="hero"
                          disabled={savingId === key}
                          onClick={() => saveLesson(selectedCourse.slug, lesson.id)}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Enregistrer
                        </Button>
                      </div>
                    );
                  })}
                  <div className="rounded-lg border border-dashed border-border p-4 space-y-3">
                    <p className="text-sm font-semibold">Ajouter une vidéo</p>
                    <Input
                      value={newLesson.title}
                      onChange={(e) => updateNewLessonDraft(section.id, { title: e.target.value })}
                      className="rounded-lg"
                      placeholder="Titre de la vidéo"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={addingSectionId === section.id}
                        onClick={() => addLesson(section.id)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        <div className="rounded-xl border border-dashed border-border bg-card p-4 space-y-3">
          <div>
            <h2 className="font-semibold">Ajouter une session</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Créez une nouvelle section (ex. Introduction, Module 2, Déploiement…).
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="new-section-title">Titre de la session</Label>
              <Input
                id="new-section-title"
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                className="rounded-lg"
                placeholder="Construire votre application"
              />
            </div>
            <Button variant="hero" size="sm" disabled={addingSession} onClick={addSection}>
              <Plus className="h-4 w-4 mr-2" />
              {addingSession ? "Ajout..." : "Ajouter la session"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un cours..."
            className="rounded-lg pl-9 bg-card"
          />
        </div>
        <Button variant="hero" size="sm" onClick={() => setShowCreateForm((v) => !v)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau cours
        </Button>
      </div>

      {showCreateForm && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-4 shadow-sm">
          <h2 className="font-semibold">Créer un cours</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="new-title">Titre</Label>
              <Input
                id="new-title"
                value={newTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="rounded-lg"
                placeholder="Mon nouveau cours"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-slug">Slug (URL)</Label>
              <Input
                id="new-slug"
                value={newSlug}
                onChange={(e) => {
                  setSlugEdited(true);
                  setNewSlug(slugifyTitle(e.target.value));
                }}
                className="rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Plan</Label>
              <Select value={newPlan} onValueChange={(v) => setNewPlan(v as "premium" | "vip")}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="hero" size="sm" disabled={creating} onClick={createCourse}>
              {creating ? "Création..." : "Créer le cours"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowCreateForm(false)}>
              Annuler
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-b border-border pb-1">
        {(Object.keys(tabLabels) as AdminCourseTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              "rounded-t-lg px-4 py-2 text-sm font-medium transition-colors",
              activeTab === tab
                ? "bg-card border border-b-0 border-border text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tabLabels[tab]} ({tabCounts[tab]})
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-border/70 bg-card shadow-sm overflow-hidden">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-display text-lg font-bold">Catalogue public</h2>
          <p className="text-sm text-muted-foreground">
            Cours visibles sur le site quand ils sont publiés. Masquez un cours ou terminez les vidéos Vimeo avant
            publication.
          </p>
        </div>

        {filteredCourses.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">
            {courses.length === 0
              ? "Aucun cours. Cliquez sur « Nouveau cours » pour commencer."
              : "Aucun cours dans cet onglet."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Cours</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Visibilité</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.map((course) => (
                  <tr key={course.slug} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <CourseThumbnailBanner
                          thumbnail={course.thumbnail}
                          slug={course.slug}
                          aspectClass="aspect-[4/3] w-16"
                          className="rounded-lg overflow-hidden shrink-0 border border-border"
                          showLabel={false}
                          showIcon={false}
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground">{course.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{course.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-800">
                        {planBadge(course.plan, course.isBase)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={course.published}
                          disabled={togglingSlug === course.slug || course.missingVimeo > 0}
                          onCheckedChange={(checked) => togglePublished(course, checked)}
                          className="data-[state=checked]:bg-[#1a2744]"
                        />
                        <span className="text-xs text-muted-foreground">
                          {course.published ? "Publié" : "Masqué"}
                          {course.missingVimeo > 0 && " · vidéos manquantes"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-lg"
                          onClick={() => openEditor(course.slug)}
                        >
                          <Pencil className="h-4 w-4 mr-1.5" />
                          Éditer
                        </Button>
                        <Button asChild variant="ghost" size="icon" className="rounded-lg">
                          <Link to="/courses/$slug" params={{ slug: course.slug }} target="_blank">
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
