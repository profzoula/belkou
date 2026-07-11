import { useEffect, useMemo, useRef, useState } from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CalendarClock,
  ChevronDown,
  ExternalLink,
  FileText,
  Gift,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
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
import { LessonContentEditor } from "@/components/admin/LessonContentEditor";
import { AdminCourseResourcesEditor } from "@/components/admin/AdminCourseResourcesEditor";
import { CourseThumbnailBanner } from "@/components/course/CourseThumbnailBanner";
import { formatCoursePrice, formatCourseDurationLabel, getCourseDisplayDuration, isFreeCourse } from "@/lib/courses";
import { siteConfig } from "@/lib/site-config";
import {
  adminAddLesson,
  adminAddSection,
  adminCreateCourse,
  adminDeleteCourse,
  adminDeleteLesson,
  adminDeleteSection,
  adminReorderLessons,
  adminReorderSections,
  adminScheduleCoursePublish,
  adminSetCoursePublished,
  adminUpdateCourse,
  adminUpdateLesson,
  getAdminCourses,
  refreshAdminSession,
} from "@/lib/fns/admin";
import {
  clearAdminSessionToken,
  isAdminAuthError,
  syncAdminSessionToken,
} from "@/lib/admin-session";
import { slugifyTitle } from "@/lib/course-storage";
import {
  formatScheduledPublishLabel,
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
} from "@/lib/course-publish";
import { adminListVideos } from "@/lib/fns/videos";
import { formatVideoStatusLabel, type VideoRecord } from "@/lib/videos";

type LessonDraft = {
  title: string;
  duration: string;
  videoId: string;
  preview: boolean;
  content: string;
  type: "video" | "article" | "resource";
};

type CourseMetaDraft = {
  title: string;
  description: string;
  whatYouLearn: string;
  instructor: string;
  price: string;
  originalPrice: string;
  skillLevel: string;
  totalDuration: string;
  bestseller: boolean;
};

type NewLessonDraft = {
  title: string;
  duration: string;
  videoId: string;
  preview: boolean;
  content: string;
  type: "video" | "article";
};

const tabLabels: Record<AdminCourseTab, string> = {
  published: "Publiés",
  scheduled: "Programmés",
  hidden: "Masqués",
  draft: "En préparation",
};

type PriceFilter = "all" | "free" | "paid";

const priceFilterLabels: Record<PriceFilter, string> = {
  all: "Tous les prix",
  free: "Gratuits",
  paid: "Payants",
};

const defaultPaidPrice = String(siteConfig.plans.premium.price);
const defaultPaidOriginalPrice = String(Math.round(siteConfig.plans.premium.price * 1.35));

function lessonToDraft(lesson: AdminCourse["sections"][number]["lessons"][number]): LessonDraft {
  return {
    title: lesson.title,
    duration: lesson.duration,
    videoId: lesson.videoId ?? "",
    preview: Boolean(lesson.preview),
    content: lesson.content ?? "",
    type: lesson.type,
  };
}

function courseToMetaDraft(course: AdminCourse): CourseMetaDraft {
  return {
    title: course.title,
    description: course.description,
    whatYouLearn: course.whatYouLearn.join("\n"),
    instructor: course.instructor,
    price: String(course.price),
    originalPrice: String(course.originalPrice),
    skillLevel: course.skillLevel,
    totalDuration: course.totalDuration,
    bestseller: Boolean(course.bestseller),
  };
}

const emptyNewLesson = (): NewLessonDraft => ({
  title: "",
  duration: "",
  videoId: "",
  preview: false,
  content: "",
  type: "video",
});

function courseTypeBadge(isBase: boolean) {
  return isBase ? "Base" : "Cours";
}

export function AdminCoursesTab() {
  const navigate = useNavigate();
  const loadFn = useServerFn(getAdminCourses);
  const refreshSessionFn = useServerFn(refreshAdminSession);
  const saveLessonFn = useServerFn(adminUpdateLesson);
  const saveCourseFn = useServerFn(adminUpdateCourse);
  const publishFn = useServerFn(adminSetCoursePublished);
  const scheduleFn = useServerFn(adminScheduleCoursePublish);
  const addLessonFn = useServerFn(adminAddLesson);
  const addSectionFn = useServerFn(adminAddSection);
  const deleteLessonFn = useServerFn(adminDeleteLesson);
  const deleteSectionFn = useServerFn(adminDeleteSection);
  const reorderLessonsFn = useServerFn(adminReorderLessons);
  const reorderSectionsFn = useServerFn(adminReorderSections);
  const listVideosFn = useServerFn(adminListVideos);
  const createFn = useServerFn(adminCreateCourse);
  const deleteFn = useServerFn(adminDeleteCourse);

  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [view, setView] = useState<"catalog" | "edit">("catalog");
  const [activeTab, setActiveTab] = useState<AdminCourseTab>("published");
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedSlug, setSelectedSlug] = useState("");
  const [drafts, setDrafts] = useState<Record<string, LessonDraft>>({});
  const [metaDraft, setMetaDraft] = useState<CourseMetaDraft | null>(null);
  const [newLessonBySection, setNewLessonBySection] = useState<Record<string, NewLessonDraft>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savingMeta, setSavingMeta] = useState(false);
  const [togglingSlug, setTogglingSlug] = useState<string | null>(null);
  const [schedulingSlug, setSchedulingSlug] = useState<string | null>(null);
  const [showScheduleFor, setShowScheduleFor] = useState<string | null>(null);
  const [editorScheduleDraft, setEditorScheduleDraft] = useState("");
  const [addingSectionId, setAddingSectionId] = useState<string | null>(null);
  const [addingSession, setAddingSession] = useState(false);
  const [deletingLessonId, setDeletingLessonId] = useState<string | null>(null);
  const [deletingSectionId, setDeletingSectionId] = useState<string | null>(null);
  const [reorderingLessonId, setReorderingLessonId] = useState<string | null>(null);
  const [reorderingSectionId, setReorderingSectionId] = useState<string | null>(null);
  const [videoLibrary, setVideoLibrary] = useState<VideoRecord[]>([]);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newFree, setNewFree] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);
  const lessonContentFlushers = useRef<Record<string, () => string>>({});

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

  const ensureAdminSession = async (): Promise<boolean> => {
    const ok = await syncAdminSessionToken(() => refreshSessionFn());
    if (!ok) {
      clearAdminSessionToken();
      toast.error("Session expirée — reconnectez-vous");
      navigate({ to: "/admin/login" });
    }
    return ok;
  };

  const handleAdminError = (error: unknown, fallback: string) => {
    const message = error instanceof Error ? error.message : fallback;
    if (isAdminAuthError(message)) {
      clearAdminSessionToken();
      toast.error("Session expirée — reconnectez-vous");
      navigate({ to: "/admin/login" });
      return;
    }
    toast.error(message);
  };

  const load = async () => {
    setLoading(true);
    try {
      if (!(await ensureAdminSession())) return;
      const result = await loadFn();
      setCourses(result.courses);
      syncDrafts(result.courses);
    } catch (error) {
      handleAdminError(error, "Chargement impossible");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const tabCounts = useMemo(() => {
    const counts: Record<AdminCourseTab, number> = {
      published: 0,
      scheduled: 0,
      hidden: 0,
      draft: 0,
    };
    for (const course of courses) {
      counts[getAdminCourseTab(course)] += 1;
    }
    return counts;
  }, [courses]);

  const filteredCourses = useMemo(() => {
    const query = search.trim().toLowerCase();
    return courses.filter((course) => {
      if (getAdminCourseTab(course) !== activeTab) return false;
      if (priceFilter === "free" && !isFreeCourse(course)) return false;
      if (priceFilter === "paid" && isFreeCourse(course)) return false;
      if (!query) return true;
      return (
        course.title.toLowerCase().includes(query) ||
        course.slug.toLowerCase().includes(query)
      );
    });
  }, [courses, activeTab, priceFilter, search]);

  const selectedCourse = useMemo(
    () => courses.find((course) => course.slug === selectedSlug),
    [courses, selectedSlug],
  );

  useEffect(() => {
    if (selectedCourse) {
      setMetaDraft(courseToMetaDraft(selectedCourse));
      setEditorScheduleDraft(toDatetimeLocalValue(selectedCourse.scheduledPublishAt));
    } else {
      setMetaDraft(null);
      setEditorScheduleDraft("");
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
      setShowScheduleFor(null);
      if (published && course.missingVideo > 0) {
        toast.success(
          `Cours publié — ${course.missingVideo} leçon${course.missingVideo > 1 ? "s" : ""} sans vidéo`,
        );
      } else {
        toast.success(published ? "Cours publié" : "Cours masqué");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Mise à jour impossible");
    } finally {
      setTogglingSlug(null);
    }
  };

  const saveSchedule = async (courseSlug: string, localValue: string, clear = false) => {
    setSchedulingSlug(courseSlug);
    try {
      const iso = clear ? null : fromDatetimeLocalValue(localValue);
      if (!clear && !iso) {
        toast.error("Date invalide");
        return;
      }

      const result = await scheduleFn({
        data: {
          courseSlug,
          scheduledPublishAt: iso,
        },
      });
      setCourses(result.courses);
      syncDrafts(result.courses);
      setShowScheduleFor(null);
      setEditorScheduleDraft(clear ? "" : localValue);
      toast.success(clear ? "Programmation annulée" : "Mise en ligne programmée");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Programmation impossible");
    } finally {
      setSchedulingSlug(null);
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
      if (price < 0 || originalPrice < 0) {
        toast.error("Les prix ne peuvent pas être négatifs");
        return;
      }

      const result = await saveCourseFn({
        data: {
          courseSlug: selectedCourse.slug,
          title: metaDraft.title.trim(),
          description: metaDraft.description,
          whatYouLearn: metaDraft.whatYouLearn
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean),
          instructor: metaDraft.instructor.trim(),
          price,
          originalPrice,
          skillLevel: metaDraft.skillLevel.trim(),
          totalDuration: getCourseDisplayDuration(selectedCourse),
          bestseller: metaDraft.bestseller,
        },
      });
      let nextCourses = result.courses;

      const currentScheduleLocal = toDatetimeLocalValue(selectedCourse.scheduledPublishAt);
      const scheduleChanged = editorScheduleDraft.trim() !== currentScheduleLocal;

      if (scheduleChanged) {
        if (!editorScheduleDraft.trim()) {
          const scheduleResult = await scheduleFn({
            data: { courseSlug: selectedCourse.slug, scheduledPublishAt: null },
          });
          nextCourses = scheduleResult.courses;
        } else {
          const iso = fromDatetimeLocalValue(editorScheduleDraft);
          if (!iso) {
            toast.error("Date de publication invalide");
            return;
          }
          const scheduleResult = await scheduleFn({
            data: { courseSlug: selectedCourse.slug, scheduledPublishAt: iso },
          });
          nextCourses = scheduleResult.courses;
        }
      }

      setCourses(nextCourses);
      syncDrafts(nextCourses);
      toast.success("Cours enregistré");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sauvegarde impossible");
    } finally {
      setSavingMeta(false);
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

  useEffect(() => {
    if (view !== "edit") return;
    listVideosFn()
      .then((result) => setVideoLibrary(result.videos))
      .catch(() => undefined);
  }, [view, listVideosFn]);

  const applyVideoSelection = (videoId: string, onPatch: (patch: Partial<LessonDraft | NewLessonDraft>) => void) => {
    const trimmed = videoId.trim();
    if (!trimmed || trimmed === "__none__") {
      onPatch({ videoId: "", duration: "" });
      return;
    }
    const video = videoLibrary.find((item) => item.id === trimmed);
    onPatch({
      videoId: trimmed,
      duration: video?.durationSeconds
        ? formatCourseDurationLabel(Math.max(1, Math.round(video.durationSeconds / 60)))
        : "",
    });
  };

  const resolveLessonDraftForSave = (
    key: string,
    draft: LessonDraft,
    lessonType?: LessonDraft["type"],
    lessonContent?: string,
  ): LessonDraft => {
    const type = draft.type ?? lessonType ?? "video";
    if (type !== "article") {
      return { ...draft, type };
    }

    const flushed = lessonContentFlushers.current[key]?.();
    const content = flushed ?? draft.content ?? lessonContent ?? "";
    return { ...draft, type, content };
  };

  const saveLesson = async (courseSlug: string, lessonId: string) => {
    const key = `${courseSlug}:${lessonId}`;
    const baseDraft = drafts[key];
    if (!baseDraft) return;

    const lesson = courses
      .flatMap((course) => (course.slug === courseSlug ? course.sections : []))
      .flatMap((section) => section.lessons)
      .find((item) => item.id === lessonId);
    const draft = resolveLessonDraftForSave(key, baseDraft, lesson?.type, lesson?.content);

    setSavingId(key);
    try {
      if (!(await ensureAdminSession())) return;
      const result = await saveLessonFn({
        data: {
          courseSlug,
          lessonId,
          title: draft.title,
          duration: draft.duration,
          videoId: draft.type === "video" ? draft.videoId || undefined : undefined,
          preview: draft.preview,
          content: draft.type === "article" ? draft.content ?? "" : undefined,
          type: (draft.type ?? lesson?.type ?? "video") === "resource"
            ? undefined
            : (draft.type ?? lesson?.type ?? "video"),
        },
      });
      setCourses(result.courses);
      syncDrafts(result.courses);
      setDrafts((current) => ({
        ...current,
        [key]: draft,
      }));
      toast.success("Leçon enregistrée");
    } catch (error) {
      handleAdminError(error, "Sauvegarde impossible");
    } finally {
      setSavingId(null);
    }
  };

  const addLesson = async (sectionId: string) => {
    if (!selectedCourse) return;
    const draft = getNewLessonDraft(sectionId);
    if (!draft.title.trim()) {
      toast.error("Titre de la leçon requis");
      return;
    }

    setAddingSectionId(sectionId);
    try {
      const newLessonKey = `new:${selectedCourse.slug}:${sectionId}`;
      const flushed = draft.type === "article" ? lessonContentFlushers.current[newLessonKey]?.() : undefined;
      const content = flushed ?? draft.content;
      const result = await addLessonFn({
        data: {
          courseSlug: selectedCourse.slug,
          sectionId,
          title: draft.title.trim(),
          type: draft.type,
          duration: draft.duration.trim() || undefined,
          videoId: draft.type === "video" ? draft.videoId.trim() || undefined : undefined,
          preview: draft.preview,
          content: draft.type === "article" ? content : undefined,
        },
      });
      setCourses(result.courses);
      syncDrafts(result.courses);
      setNewLessonBySection((current) => ({ ...current, [sectionId]: emptyNewLesson() }));
      toast.success(draft.type === "article" ? "Module texte ajouté" : "Vidéo ajoutée");
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

  const deleteSection = async (sectionId: string, sectionTitle: string) => {
    if (!selectedCourse) return;
    const isLastSection = selectedCourse.sections.length <= 1;
    const message = isLastSection
      ? `Supprimer la session « ${sectionTitle} » ? Une session Introduction vide sera recréée.`
      : `Supprimer la session « ${sectionTitle} » et toutes ses leçons ?`;
    if (!window.confirm(message)) return;

    setDeletingSectionId(sectionId);
    try {
      const result = await deleteSectionFn({
        data: {
          courseSlug: selectedCourse.slug,
          sectionId,
        },
      });
      setCourses(result.courses);
      syncDrafts(result.courses);
      toast.success("Session supprimée");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Suppression impossible");
    } finally {
      setDeletingSectionId(null);
    }
  };

  const moveLesson = async (sectionId: string, lessonId: string, direction: "up" | "down") => {
    if (!selectedCourse) return;

    const section = selectedCourse.sections.find((item) => item.id === sectionId);
    if (!section) return;

    const index = section.lessons.findIndex((lesson) => lesson.id === lessonId);
    if (index === -1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= section.lessons.length) return;

    const lessonIds = section.lessons.map((lesson) => lesson.id);
    [lessonIds[index], lessonIds[targetIndex]] = [lessonIds[targetIndex], lessonIds[index]];

    setReorderingLessonId(lessonId);
    try {
      const result = await reorderLessonsFn({
        data: {
          courseSlug: selectedCourse.slug,
          sectionId,
          lessonIds,
        },
      });
      setCourses(result.courses);
      syncDrafts(result.courses);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Réorganisation impossible");
    } finally {
      setReorderingLessonId(null);
    }
  };

  const moveSection = async (sectionId: string, direction: "up" | "down") => {
    if (!selectedCourse) return;

    const index = selectedCourse.sections.findIndex((section) => section.id === sectionId);
    if (index === -1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= selectedCourse.sections.length) return;

    const sectionIds = selectedCourse.sections.map((section) => section.id);
    [sectionIds[index], sectionIds[targetIndex]] = [sectionIds[targetIndex], sectionIds[index]];

    setReorderingSectionId(sectionId);
    try {
      const result = await reorderSectionsFn({
        data: {
          courseSlug: selectedCourse.slug,
          sectionIds,
        },
      });
      setCourses(result.courses);
      syncDrafts(result.courses);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Réorganisation impossible");
    } finally {
      setReorderingSectionId(null);
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
          free: newFree,
        },
      });
      setCourses(result.courses);
      setShowCreateForm(false);
      setNewTitle("");
      setNewSlug("");
      setNewDescription("");
      setNewFree(false);
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
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="meta-learn">Ce que vous apprendrez</Label>
              <Textarea
                id="meta-learn"
                value={metaDraft.whatYouLearn}
                onChange={(e) => updateMetaDraft({ whatYouLearn: e.target.value })}
                placeholder={"Une ligne par point, ex. :\nUtiliser Cursor pour générer du code\nDéployer votre première app"}
                className="rounded-lg min-h-[120px]"
              />
              <p className="text-xs text-muted-foreground">
                Une ligne = un point sur la page d&apos;inscription (section « Ce que vous apprendrez »).
              </p>
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
              <Label htmlFor="meta-duration">Durée totale (vidéos)</Label>
              <Input
                id="meta-duration"
                value={selectedCourse ? getCourseDisplayDuration(selectedCourse) : "—"}
                readOnly
                className="rounded-lg bg-muted/40"
              />
              <p className="text-xs text-muted-foreground">
                Calculée automatiquement à partir de la durée de chaque leçon vidéo.
              </p>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <div className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/20 px-4 py-3">
                <div>
                  <Label htmlFor="meta-free" className="text-sm font-medium">
                    Cours gratuit
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Affiché comme « Gratuit » sur le site. Mettez le prix à 0 $.
                  </p>
                </div>
                <Switch
                  id="meta-free"
                  checked={Number(metaDraft.price) <= 0}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      updateMetaDraft({ price: "0", originalPrice: "0" });
                    } else {
                      updateMetaDraft({
                        price: defaultPaidPrice,
                        originalPrice: defaultPaidOriginalPrice,
                      });
                    }
                  }}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="meta-price">Prix ($)</Label>
              <Input
                id="meta-price"
                type="number"
                min={0}
                value={metaDraft.price}
                disabled={Number(metaDraft.price) <= 0}
                onChange={(e) => updateMetaDraft({ price: e.target.value })}
                className="rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="meta-original-price">Prix barré ($)</Label>
              <Input
                id="meta-original-price"
                type="number"
                min={0}
                value={metaDraft.originalPrice}
                disabled={Number(metaDraft.price) <= 0}
                onChange={(e) => updateMetaDraft({ originalPrice: e.target.value })}
                className="rounded-lg"
                placeholder="Optionnel — pour afficher une réduction"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border/70 bg-card p-4 space-y-4 shadow-sm">
          <div>
            <h2 className="font-semibold flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-primary" />
              Programmer la mise en ligne
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Le cours sera visible sur le site immédiatement pour les inscriptions. Les vidéos se débloquent automatiquement à la date choisie. Enregistré avec le bouton Enregistrer ci-dessus.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="space-y-1.5 flex-1">
              <Label htmlFor="schedule-at">Date et heure de publication</Label>
              <Input
                id="schedule-at"
                type="datetime-local"
                value={editorScheduleDraft}
                onChange={(e) => setEditorScheduleDraft(e.target.value)}
                className="rounded-lg max-w-sm"
              />
            </div>
            {editorScheduleDraft && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-lg"
                disabled={savingMeta}
                onClick={() => setEditorScheduleDraft("")}
              >
                <X className="h-4 w-4 mr-2" />
                Effacer la date
              </Button>
            )}
          </div>
          {selectedCourse.isScheduled && selectedCourse.scheduledPublishAt && (
            <p className="text-sm text-sky-700 bg-sky-50 rounded-lg px-3 py-2">
              Inscriptions ouvertes — vidéos disponibles le{" "}
              {formatScheduledPublishLabel(selectedCourse.scheduledPublishAt)}
            </p>
          )}
          {selectedCourse.isLive && !selectedCourse.isScheduled && (
            <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
              Ce cours est actuellement visible sur le site public.
            </p>
          )}
        </div>

        <AdminCourseThumbnailEditor
          slug={selectedCourse.slug}
          imageUrl={selectedCourse.thumbnail.imageUrl}
          gradient={selectedCourse.thumbnail.gradient}
          label={selectedCourse.thumbnail.label}
          onUpdated={(updatedCourses) => {
            setCourses(updatedCourses);
            syncDrafts(updatedCourses);
          }}
        />

        <AdminCourseResourcesEditor
          courseSlug={selectedCourse.slug}
          resources={selectedCourse.resources ?? []}
          onUpdated={(updatedCourses) => {
            setCourses(updatedCourses);
            syncDrafts(updatedCourses);
          }}
        />

        <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm">
          <p className="font-semibold">Vidéos et modules texte</p>
          <p className="mt-1 text-muted-foreground text-xs leading-relaxed">
            Dans chaque session, descendez jusqu&apos;à{" "}
            <strong className="text-foreground">Ajouter une leçon</strong> →{" "}
            <strong className="text-foreground">Module texte</strong>. Cliquez{" "}
            <strong className="text-foreground">Modèle</strong> pour Session 1 + 1.1, 1.2 — ou boutons{" "}
            <strong className="text-foreground">Session</strong> / <strong className="text-foreground">1.1</strong>.
          </p>
        </div>

        <Accordion
          type="multiple"
          key={selectedCourse.sections
            .map((section) => `${section.id}:${section.lessons.map((lesson) => lesson.id).join(",")}`)
            .join("|")}
          defaultValue={selectedCourse.sections.map((s) => s.id)}
          className="space-y-3"
        >
          {selectedCourse.sections.map((section) => {
            const newLesson = getNewLessonDraft(section.id);
            return (
              <AccordionItem key={section.id} value={section.id} className="rounded-xl border border-border bg-card px-4">
                <AccordionPrimitive.Header className="flex items-center gap-2">
                  <AccordionPrimitive.Trigger
                    className={cn(
                      "flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all hover:no-underline text-left",
                      "[&[data-state=open]>svg]:rotate-180",
                    )}
                  >
                    <div className="text-left">
                      <p className="font-semibold">{section.title}</p>
                      <p className="text-xs text-muted-foreground">{section.lessons.length} leçons</p>
                    </div>
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
                  </AccordionPrimitive.Trigger>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={
                        reorderingSectionId === section.id ||
                        selectedCourse.sections.findIndex((item) => item.id === section.id) === 0
                      }
                      onClick={() => void moveSection(section.id, "up")}
                      aria-label="Monter la session"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={
                        reorderingSectionId === section.id ||
                        selectedCourse.sections.findIndex((item) => item.id === section.id) ===
                          selectedCourse.sections.length - 1
                      }
                      onClick={() => void moveSection(section.id, "down")}
                      aria-label="Descendre la session"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 shrink-0 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      disabled={deletingSectionId === section.id}
                      onClick={() => void deleteSection(section.id, section.title)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      {deletingSectionId === section.id ? "..." : "Supprimer"}
                    </Button>
                  </div>
                </AccordionPrimitive.Header>
                <AccordionContent className="pb-4 space-y-4">
                  {section.lessons.map((lesson, index) => {
                    const key = `${selectedCourse.slug}:${lesson.id}`;
                    const draft = drafts[key] ?? lessonToDraft(lesson);
                    return (
                      <div key={lesson.id} className="rounded-lg border border-border p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold">
                              {index + 1}. {lesson.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {lesson.type === "article"
                                ? "Module texte"
                                : lesson.type === "resource"
                                  ? "Ressource"
                                  : "Vidéo"}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              disabled={reorderingLessonId === lesson.id || index === 0}
                              onClick={() => void moveLesson(section.id, lesson.id, "up")}
                              aria-label="Monter la leçon"
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              disabled={
                                reorderingLessonId === lesson.id ||
                                index === section.lessons.length - 1
                              }
                              onClick={() => void moveLesson(section.id, lesson.id, "down")}
                              aria-label="Descendre la leçon"
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
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
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {lesson.type !== "resource" && (
                            <div className="space-y-1.5">
                              <Label>Type</Label>
                              <Select
                                value={draft.type === "resource" ? "video" : draft.type}
                                onValueChange={(value) => {
                                  const type = value as "video" | "article";
                                  updateDraft(selectedCourse.slug, lesson.id, {
                                    type,
                                    ...(type === "article" ? { videoId: "", duration: draft.duration || "5 min" } : {}),
                                  });
                                }}
                              >
                                <SelectTrigger className="rounded-lg">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="video">Vidéo</SelectItem>
                                  <SelectItem value="article">Module texte</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}
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
                          {draft.type === "video" && (
                            <>
                              <div className="space-y-1.5 sm:col-span-2">
                                <Label>Vidéo uploadée</Label>
                                <Select
                                  value={draft.videoId || "__none__"}
                                  onValueChange={(value) =>
                                    applyVideoSelection(value, (patch) =>
                                      updateDraft(selectedCourse.slug, lesson.id, patch),
                                    )
                                  }
                                >
                                  <SelectTrigger className="rounded-lg">
                                    <SelectValue placeholder="Choisir une vidéo" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="__none__">— Aucune —</SelectItem>
                                    {videoLibrary.map((video) => (
                                      <SelectItem key={video.id} value={video.id}>
                                        {video.title} · {formatVideoStatusLabel(video.status)}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <p className="text-[11px] text-muted-foreground">
                                  Uploadez d&apos;abord dans Admin → Vidéos, puis liez la leçon ici.
                                </p>
                              </div>
                              <div className="space-y-1.5">
                                <Label>Durée (auto)</Label>
                                <Input
                                  value={draft.duration || "—"}
                                  readOnly
                                  className="rounded-lg bg-muted/40"
                                  placeholder="Auto depuis la vidéo"
                                />
                              </div>
                              <div className="space-y-1.5 sm:col-span-2">
                                <label className="flex items-center gap-2 text-sm">
                                  <input
                                    type="checkbox"
                                    checked={draft.preview}
                                    onChange={(e) =>
                                      updateDraft(selectedCourse.slug, lesson.id, { preview: e.target.checked })
                                    }
                                    className="rounded border-border"
                                  />
                                  Preview gratuite (visible sans inscription)
                                </label>
                              </div>
                            </>
                          )}
                          {draft.type === "article" && (
                            <>
                              <div className="space-y-1.5">
                                <Label>Durée de lecture</Label>
                                <Input
                                  value={draft.duration}
                                  onChange={(e) =>
                                    updateDraft(selectedCourse.slug, lesson.id, { duration: e.target.value })
                                  }
                                  className="rounded-lg"
                                  placeholder="8 min"
                                />
                              </div>
                              <div className="space-y-1.5 sm:col-span-2">
                                <Label>Contenu</Label>
                                <LessonContentEditor
                                  key={key}
                                  value={draft.content || lesson.content || ""}
                                  onChange={(content) =>
                                    updateDraft(selectedCourse.slug, lesson.id, { content })
                                  }
                                  onRegisterFlush={(flush) => {
                                    if (flush) lessonContentFlushers.current[key] = flush;
                                    else delete lessonContentFlushers.current[key];
                                  }}
                                />
                              </div>
                              <div className="space-y-1.5 sm:col-span-2">
                                <label className="flex items-center gap-2 text-sm">
                                  <input
                                    type="checkbox"
                                    checked={draft.preview}
                                    onChange={(e) =>
                                      updateDraft(selectedCourse.slug, lesson.id, { preview: e.target.checked })
                                    }
                                    className="rounded border-border"
                                  />
                                  Preview gratuite (visible sans inscription)
                                </label>
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
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold">Ajouter une leçon</p>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={newLesson.type === "video" ? "default" : "outline"}
                          className="h-8 rounded-lg text-xs"
                          onClick={() => updateNewLessonDraft(section.id, { type: "video" })}
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          Vidéo
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={newLesson.type === "article" ? "default" : "outline"}
                          className="h-8 rounded-lg text-xs"
                          onClick={() => updateNewLessonDraft(section.id, { type: "article" })}
                        >
                          <FileText className="h-3.5 w-3.5 mr-1" />
                          Module texte
                        </Button>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label>Type</Label>
                        <Select
                          value={newLesson.type}
                          onValueChange={(value) =>
                            updateNewLessonDraft(section.id, { type: value as NewLessonDraft["type"] })
                          }
                        >
                          <SelectTrigger className="rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="video">Vidéo</SelectItem>
                            <SelectItem value="article">Module texte</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor={`new-lesson-title-${section.id}`}>Titre</Label>
                        <Input
                          id={`new-lesson-title-${section.id}`}
                          value={newLesson.title}
                          onChange={(e) => updateNewLessonDraft(section.id, { title: e.target.value })}
                          className="rounded-lg"
                          placeholder={
                            newLesson.type === "article"
                              ? "Ex. Types de malware"
                              : "Ex. Configuration de l'environnement"
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`new-lesson-duration-${section.id}`}>
                          {newLesson.type === "article" ? "Durée de lecture" : "Durée (auto)"}
                        </Label>
                        {newLesson.type === "video" ? (
                          <Input
                            id={`new-lesson-duration-${section.id}`}
                            value={newLesson.duration || "—"}
                            readOnly
                            className="rounded-lg bg-muted/40"
                            placeholder="Auto depuis la vidéo"
                          />
                        ) : (
                          <Input
                            id={`new-lesson-duration-${section.id}`}
                            value={newLesson.duration}
                            onChange={(e) => updateNewLessonDraft(section.id, { duration: e.target.value })}
                            className="rounded-lg"
                            placeholder="8 min"
                          />
                        )}
                      </div>
                      {newLesson.type === "video" ? (
                        <div className="space-y-1.5 sm:col-span-2">
                          <Label htmlFor={`new-lesson-video-${section.id}`}>Vidéo uploadée</Label>
                          <Select
                            value={newLesson.videoId || "__none__"}
                            onValueChange={(value) =>
                              applyVideoSelection(value, (patch) =>
                                updateNewLessonDraft(section.id, patch),
                              )
                            }
                          >
                            <SelectTrigger id={`new-lesson-video-${section.id}`} className="rounded-lg">
                              <SelectValue placeholder="Choisir une vidéo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">— Aucune —</SelectItem>
                              {videoLibrary.map((video) => (
                                <SelectItem key={video.id} value={video.id}>
                                  {video.title} · {formatVideoStatusLabel(video.status)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <div className="space-y-1.5 sm:col-span-2">
                          <Label htmlFor={`new-lesson-content-${section.id}`}>Contenu</Label>
                          <LessonContentEditor
                            value={newLesson.content}
                            onChange={(content) => updateNewLessonDraft(section.id, { content })}
                            onRegisterFlush={(flush) => {
                              const newKey = `new:${selectedCourse.slug}:${section.id}`;
                              if (flush) lessonContentFlushers.current[newKey] = flush;
                              else delete lessonContentFlushers.current[newKey];
                            }}
                          />
                        </div>
                      )}
                      <div className="space-y-1.5 sm:col-span-2">
                        {newLesson.type === "video" ? (
                          <p className="text-[11px] text-muted-foreground">
                            Uploadez dans Admin → Vidéos, puis liez la leçon ici — la durée se calcule automatiquement.
                          </p>
                        ) : (
                          <p className="text-[11px] text-muted-foreground">
                            Cliquez <strong>Modèle</strong> dans l&apos;éditeur Visuel pour commencer.
                          </p>
                        )}
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={newLesson.preview}
                            onChange={(e) => updateNewLessonDraft(section.id, { preview: e.target.checked })}
                            className="rounded border-border"
                          />
                          Preview gratuite (visible sans inscription)
                        </label>
                      </div>
                    </div>
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
              Créez une nouvelle section (ex. Introduction, Module 2, Déploiement…). Utilisez{" "}
              <strong className="text-foreground">Supprimer</strong> à droite de chaque session pour l&apos;effacer.
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
            <div className="space-y-1.5 sm:col-span-2">
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
            <div className="space-y-1.5 sm:col-span-2">
              <div className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/20 px-4 py-3">
                <div>
                  <Label htmlFor="new-free" className="text-sm font-medium">
                    Cours gratuit
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Créer ce cours avec un prix de 0 $ dès le départ.
                  </p>
                </div>
                <Switch id="new-free" checked={newFree} onCheckedChange={setNewFree} />
              </div>
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

      <div className="flex flex-wrap items-center gap-2">
        {(Object.keys(priceFilterLabels) as PriceFilter[]).map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setPriceFilter(filter)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              priceFilter === filter
                ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {filter === "free" ? <Gift className="h-3.5 w-3.5" /> : null}
            {priceFilterLabels[filter]}
          </button>
        ))}
      </div>

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
            Publiez immédiatement ou programmez une date de mise en ligne automatique.
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
                  <th className="px-4 py-3 font-medium">Prix</th>
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
                      {isFreeCourse(course) ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                          <Gift className="h-3 w-3" />
                          Gratuit
                        </span>
                      ) : (
                        <span className="text-sm font-semibold text-foreground">
                          {formatCoursePrice(course.price)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-800">
                        {courseTypeBadge(course.isBase)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-2 min-w-[220px]">
                        {course.isScheduled && course.scheduledPublishAt ? (
                          <div className="space-y-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-800">
                              <CalendarClock className="h-3 w-3" />
                              Inscriptions ouvertes · vidéos le{" "}
                              {formatScheduledPublishLabel(course.scheduledPublishAt)}
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 rounded-lg text-xs"
                              disabled={schedulingSlug === course.slug}
                              onClick={() => saveSchedule(course.slug, "", true)}
                            >
                              Annuler
                            </Button>
                          </div>
                        ) : showScheduleFor === course.slug ? (
                          <div className="space-y-2">
                            <Input
                              type="datetime-local"
                              value={editorScheduleDraft}
                              onChange={(e) => setEditorScheduleDraft(e.target.value)}
                              className="rounded-lg h-8 text-xs"
                            />
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                size="sm"
                                className="h-7 rounded-lg text-xs"
                                disabled={schedulingSlug === course.slug}
                                onClick={() => saveSchedule(course.slug, editorScheduleDraft)}
                              >
                                OK
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 rounded-lg text-xs"
                                onClick={() => setShowScheduleFor(null)}
                              >
                                Annuler
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={course.isLive}
                                disabled={togglingSlug === course.slug || course.isScheduled}
                                onCheckedChange={(checked) => togglePublished(course, checked)}
                                className="data-[state=checked]:bg-[#1a2744]"
                              />
                              <span className="text-xs text-muted-foreground">
                                {course.isLive ? "Publié" : "Masqué"}
                                {course.missingVideo > 0 && " · vidéos manquantes"}
                              </span>
                            </div>
                            {course.missingVideo === 0 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 rounded-lg text-xs"
                                onClick={() => {
                                  setShowScheduleFor(course.slug);
                                  setEditorScheduleDraft(
                                    toDatetimeLocalValue(course.scheduledPublishAt),
                                  );
                                }}
                              >
                                <CalendarClock className="h-3 w-3 mr-1" />
                                Programmer
                              </Button>
                            )}
                          </div>
                        )}
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
