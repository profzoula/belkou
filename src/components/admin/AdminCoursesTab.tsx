import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { adminCreateCourse, adminDeleteCourse, adminUpdateLesson, getAdminCourses } from "@/lib/fns/admin";
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

function lessonToDraft(lesson: Course["sections"][number]["lessons"][number]): LessonDraft {
  return {
    title: lesson.title,
    duration: lesson.duration,
    vimeo: lesson.vimeo ?? "",
    preview: Boolean(lesson.preview),
  };
}

export function AdminCoursesTab() {
  const loadFn = useServerFn(getAdminCourses);
  const saveFn = useServerFn(adminUpdateLesson);
  const createFn = useServerFn(adminCreateCourse);
  const deleteFn = useServerFn(adminDeleteCourse);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [drafts, setDrafts] = useState<Record<string, LessonDraft>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
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

  const updateDraft = (courseSlug: string, lessonId: string, patch: Partial<LessonDraft>) => {
    const key = `${courseSlug}:${lessonId}`;
    setDrafts((current) => ({
      ...current,
      [key]: { ...current[key], ...patch },
    }));
  };

  const saveLesson = async (courseSlug: string, lessonId: string) => {
    const key = `${courseSlug}:${lessonId}`;
    const draft = drafts[key];
    if (!draft) return;

    setSavingId(key);
    try {
      const result = await saveFn({
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
          <h1 className="font-display text-2xl font-bold">Cours & vidéos Vimeo</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Un cours de base est inclus dans le code. Créez les autres ici — sauvegardés dans Supabase.
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

      {selectedCourse && (
        <Accordion type="multiple" defaultValue={selectedCourse.sections.map((s) => s.id)} className="space-y-3">
          {selectedCourse.sections.map((section) => (
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

                      {lesson.type === "video" && (
                        <>
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
                          </div>
                          <label className="flex items-center gap-2 text-sm cursor-pointer">
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
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      <p className="text-xs text-muted-foreground">
        Première utilisation ? Exécutez <code className="rounded bg-muted px-1">supabase/site_content.sql</code> dans
        Supabase SQL Editor.
      </p>
    </div>
  );
}
