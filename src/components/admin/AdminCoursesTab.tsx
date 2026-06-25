import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  adminAddLesson,
  adminCreateCourse,
  adminDeleteCourse,
  adminUpdateCourse,
  adminUpdateLesson,
  getAdminCourses,
} from "@/lib/fns/admin";
import type { Course } from "@/lib/courses";
import { isBaseCourseSlug } from "@/lib/courses";
import { slugifyTitle } from "@/lib/course-storage";
import { Link } from "@tanstack/react-router";

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
};

type NewLessonDraft = {
  title: string;
  duration: string;
  vimeo: string;
  preview: boolean;
};

function lessonToDraft(lesson: Course["sections"][number]["lessons"][number]): LessonDraft {
  return {
    title: lesson.title,
    duration: lesson.duration,
    vimeo: lesson.vimeo ?? "",
    preview: Boolean(lesson.preview),
  };
}

function courseToMetaDraft(course: Course): CourseMetaDraft {
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
  };
}

const emptyNewLesson = (): NewLessonDraft => ({
  title: "",
  duration: "5min",
  vimeo: "",
  preview: false,
});

export function AdminCoursesTab() {
  const loadFn = useServerFn(getAdminCourses);
  const saveLessonFn = useServerFn(adminUpdateLesson);
  const saveCourseFn = useServerFn(adminUpdateCourse);
  const addLessonFn = useServerFn(adminAddLesson);
  const createFn = useServerFn(adminCreateCourse);
  const deleteFn = useServerFn(adminDeleteCourse);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [drafts, setDrafts] = useState<Record<string, LessonDraft>>({});
  const [metaDraft, setMetaDraft] = useState<CourseMetaDraft | null>(null);
  const [newLessonBySection, setNewLessonBySection] = useState<Record<string, NewLessonDraft>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savingMeta, setSavingMeta] = useState(false);
  const [addingSectionId, setAddingSectionId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPlan, setNewPlan] = useState<"premium" | "vip">("premium");
  const [slugEdited, setSlugEdited] = useState(false);

  const syncDrafts = (list: Course[]) => {
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
      setSelectedSlug((current) => {
        if (current && result.courses.some((course) => course.slug === current)) {
          return current;
        }
        return result.courses[0]?.slug ?? "";
      });
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
      setSelectedSlug(result.createdSlug);
      syncDrafts(result.courses);
      setShowCreateForm(false);
      setNewTitle("");
      setNewSlug("");
      setNewDescription("");
      setNewPlan("premium");
      setSlugEdited(false);
      toast.success("Cours créé");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Création impossible");
    } finally {
      setCreating(false);
    }
  };

  const deleteCourse = async () => {
    if (!selectedCourse || isBaseCourseSlug(selectedCourse.slug)) return;
    if (!window.confirm(`Supprimer « ${selectedCourse.title} » ?`)) return;

    setDeleting(true);
    try {
      const result = await deleteFn({ data: { slug: selectedCourse.slug } });
      setCourses(result.courses);
      setSelectedSlug(result.courses[0]?.slug ?? "");
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
      <div className="surface rounded-2xl p-10 text-center text-sm text-muted-foreground">
        Chargement des cours...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Cours & vidéos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Modifiez titres, infos, vidéos Vimeo — ou créez de nouveaux cours.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="hero" size="sm" onClick={() => setShowCreateForm((v) => !v)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau cours
          </Button>
          {selectedCourse && (
            <Button asChild variant="outline" size="sm">
              <Link to="/courses/$slug" params={{ slug: selectedCourse.slug }} target="_blank">
                <ExternalLink className="h-4 w-4 mr-2" />
                Voir le cours
              </Link>
            </Button>
          )}
        </div>
      </div>

      {showCreateForm && (
        <div className="surface rounded-xl p-4 space-y-4">
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
                placeholder="mon-nouveau-cours"
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
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="new-desc">Description (optionnel)</Label>
              <Input
                id="new-desc"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="rounded-lg"
              />
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

      <div className="surface rounded-xl p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground">Cours à éditer</Label>
            <Select value={selectedSlug} onValueChange={setSelectedSlug}>
              <SelectTrigger className="mt-2 rounded-lg">
                <SelectValue placeholder="Choisir un cours" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.slug} value={course.slug}>
                    {course.title}
                    {isBaseCourseSlug(course.slug) ? " (base)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedCourse && !isBaseCourseSlug(selectedCourse.slug) && (
            <Button variant="destructive" size="sm" disabled={deleting} onClick={deleteCourse}>
              <Trash2 className="h-4 w-4 mr-2" />
              {deleting ? "Suppression..." : "Supprimer"}
            </Button>
          )}
        </div>
      </div>

      {selectedCourse && metaDraft && (
        <div className="surface rounded-xl p-4 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">Informations du cours</h2>
              <p className="text-xs text-muted-foreground">
                Titre, prix, description — visible sur la page du cours.
              </p>
            </div>
            <Button variant="hero" size="sm" disabled={savingMeta} onClick={saveCourseMeta}>
              <Save className="h-4 w-4 mr-2" />
              {savingMeta ? "Enregistrement..." : "Enregistrer le cours"}
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
                placeholder="8h total"
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
              <Label htmlFor="meta-original">Prix barré ($)</Label>
              <Input
                id="meta-original"
                type="number"
                min={0}
                value={metaDraft.originalPrice}
                onChange={(e) => updateMetaDraft({ originalPrice: e.target.value })}
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
            <div className="space-y-1.5">
              <Label htmlFor="meta-level">Niveau</Label>
              <Input
                id="meta-level"
                value={metaDraft.skillLevel}
                onChange={(e) => updateMetaDraft({ skillLevel: e.target.value })}
                className="rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="meta-thumb-label">Étiquette miniature</Label>
              <Input
                id="meta-thumb-label"
                value={metaDraft.thumbnailLabel}
                onChange={(e) => updateMetaDraft({ thumbnailLabel: e.target.value })}
                className="rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="meta-thumb-gradient">Gradient miniature</Label>
              <Input
                id="meta-thumb-gradient"
                value={metaDraft.thumbnailGradient}
                onChange={(e) => updateMetaDraft({ thumbnailGradient: e.target.value })}
                className="rounded-lg"
                placeholder="from-violet-600 via-indigo-600 to-blue-700"
              />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer sm:col-span-2">
              <input
                type="checkbox"
                checked={metaDraft.bestseller}
                onChange={(e) => updateMetaDraft({ bestseller: e.target.checked })}
                className="rounded border-border"
              />
              Afficher comme bestseller
            </label>
          </div>
        </div>
      )}

      {selectedCourse && (
        <Accordion type="multiple" defaultValue={selectedCourse.sections.map((s) => s.id)} className="space-y-3">
          {selectedCourse.sections.map((section) => {
            const newLesson = getNewLessonDraft(section.id);

            return (
              <AccordionItem key={section.id} value={section.id} className="surface rounded-xl border px-4">
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
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold">
                            {index + 1}. {lesson.title}
                          </p>
                          <span className="text-[11px] uppercase text-muted-foreground">{lesson.type}</span>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1.5 sm:col-span-2">
                            <Label htmlFor={`${key}-title`}>Titre</Label>
                            <Input
                              id={`${key}-title`}
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
                                <Label htmlFor={`${key}-duration`}>Durée</Label>
                                <Input
                                  id={`${key}-duration`}
                                  value={draft.duration}
                                  onChange={(e) =>
                                    updateDraft(selectedCourse.slug, lesson.id, { duration: e.target.value })
                                  }
                                  className="rounded-lg"
                                  placeholder="12min"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label htmlFor={`${key}-vimeo`}>Vimeo (ID ou URL)</Label>
                                <Input
                                  id={`${key}-vimeo`}
                                  value={draft.vimeo}
                                  onChange={(e) =>
                                    updateDraft(selectedCourse.slug, lesson.id, { vimeo: e.target.value })
                                  }
                                  className="rounded-lg"
                                  placeholder="1204014571"
                                />
                              </div>
                              <label className="flex items-center gap-2 text-sm cursor-pointer sm:col-span-2">
                                <input
                                  type="checkbox"
                                  checked={draft.preview}
                                  onChange={(e) =>
                                    updateDraft(selectedCourse.slug, lesson.id, { preview: e.target.checked })
                                  }
                                  className="rounded border-border"
                                />
                                Preview gratuite (visible sans payer)
                              </label>
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
                          {savingId === key ? "Enregistrement..." : "Enregistrer"}
                        </Button>
                      </div>
                    );
                  })}

                  <div className="rounded-lg border border-dashed border-border p-4 space-y-3">
                    <p className="text-sm font-semibold">Ajouter une vidéo</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor={`new-${section.id}-title`}>Titre de la vidéo</Label>
                        <Input
                          id={`new-${section.id}-title`}
                          value={newLesson.title}
                          onChange={(e) => updateNewLessonDraft(section.id, { title: e.target.value })}
                          className="rounded-lg"
                          placeholder="Nouvelle leçon"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`new-${section.id}-duration`}>Durée</Label>
                        <Input
                          id={`new-${section.id}-duration`}
                          value={newLesson.duration}
                          onChange={(e) => updateNewLessonDraft(section.id, { duration: e.target.value })}
                          className="rounded-lg"
                          placeholder="5min"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`new-${section.id}-vimeo`}>Vimeo (ID ou URL)</Label>
                        <Input
                          id={`new-${section.id}-vimeo`}
                          value={newLesson.vimeo}
                          onChange={(e) => updateNewLessonDraft(section.id, { vimeo: e.target.value })}
                          className="rounded-lg"
                        />
                      </div>
                      <label className="flex items-center gap-2 text-sm cursor-pointer sm:col-span-2">
                        <input
                          type="checkbox"
                          checked={newLesson.preview}
                          onChange={(e) => updateNewLessonDraft(section.id, { preview: e.target.checked })}
                          className="rounded border-border"
                        />
                        Preview gratuite
                      </label>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={addingSectionId === section.id}
                      onClick={() => addLesson(section.id)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {addingSectionId === section.id ? "Ajout..." : "Ajouter la vidéo"}
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}

      <p className="text-xs text-muted-foreground">
        Première utilisation ? Exécutez <code className="rounded bg-muted px-1">supabase/site_content.sql</code> dans
        Supabase SQL Editor, et ajoutez <code className="rounded bg-muted px-1">SUPABASE_SERVICE_ROLE_KEY</code>.
      </p>
    </div>
  );
}
