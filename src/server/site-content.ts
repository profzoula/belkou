import type { Course, CourseLesson, CourseSection } from "@/lib/courses";
import {
  courses as baseCourses,
  getAllLessons,
  isBaseCourseSlug,
  isWelcomePreviewLesson,
} from "@/lib/courses";
import {
  addLessonToStoredCourse,
  addSectionToStoredCourse,
  buildDefaultStoredCourse,
  buildNewSection,
  buildNewLesson,
  deleteLessonFromStoredCourse,
  reorderLessonsInStoredCourse,
  reorderSectionsInStoredCourse,
  deleteSectionFromStoredCourse,
  patchLessonInStoredCourse,
  patchStoredCourseMeta,
  storedCourseToCourse,
  type AddLessonInput,
  type CourseMetaPatch,
  type CreateCourseInput,
  type StoredCourse,
} from "@/lib/course-storage";
import {
  buildNewService,
  getDefaultServices,
  patchStoredService,
  type CreateServiceInput,
  type ServicePatch,
  type StoredService,
} from "@/lib/service-storage";
import { siteConfig } from "@/lib/site-config";
import { isCourseListed } from "@/lib/course-publish";
import { getSupabaseAdmin } from "@/server/supabase-registrations";

export type CourseLessonOverride = Partial<
  Pick<
    CourseLesson,
    "videoId" | "vimeoUrl" | "youtubeUrl" | "preview" | "title" | "duration" | "content" | "type"
  >
>;

export type CourseMetaOverride = CourseMetaPatch;

export type CourseOverride = {
  meta?: CourseMetaOverride;
  lessons?: Record<string, CourseLessonOverride>;
  addedLessons?: Array<{ sectionId: string; lesson: CourseLesson }>;
  addedSections?: CourseSection[];
  deletedLessons?: string[];
  deletedSections?: string[];
  lessonOrderBySection?: Record<string, string[]>;
  sectionOrder?: string[];
};

export type CourseOverridesMap = Record<string, CourseOverride>;

import type { SiteSettings } from "@/lib/site-settings";

const COURSE_OVERRIDES_KEY = "course_overrides";
const ADMIN_COURSES_KEY = "admin_courses";
const ADMIN_SERVICES_KEY = "admin_services";
const SITE_SETTINGS_KEY = "site_settings";
const COURSE_CATEGORIES_KEY = "course_categories";

function isMissingTable(message: string): boolean {
  return (
    message.includes("does not exist") ||
    message.includes("Could not find the table") ||
    message.includes("schema cache")
  );
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const sb = getSupabaseAdmin();
  if (!sb) return fallback;

  const { data, error } = await sb
    .from("site_content")
    .select("value")
    .eq("key", key)
    .maybeSingle();

  if (error) {
    if (!isMissingTable(error.message)) {
      console.warn(`[BelKou] site_content read (${key}):`, error.message);
    }
    return fallback;
  }

  return (data?.value as T) ?? fallback;
}

async function writeJson<T>(key: string, value: T): Promise<{ ok: boolean; reason?: string }> {
  const sb = getSupabaseAdmin();
  if (!sb) {
    return { ok: false, reason: "Supabase non configurÃÂÃÂ© (SUPABASE_SERVICE_ROLE_KEY)" };
  }

  const { error } = await sb.from("site_content").upsert(
    {
      key,
      value,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );

  if (error) {
    if (isMissingTable(error.message)) {
      return {
        ok: false,
        reason: "Table site_content manquante ÃÂ¢ÃÂÃÂ exÃÂÃÂ©cutez supabase/site_content.sql",
      };
    }
    console.error(`[BelKou] site_content write (${key}):`, error.message);
    return { ok: false, reason: error.message };
  }

  return { ok: true };
}

export function mergeCourse(base: Course, override?: CourseOverride): Course {
  if (!override) return base;

  let merged: Course = { ...base };

  if (override.meta) {
    const meta = override.meta;
    merged = {
      ...merged,
      ...(meta.title !== undefined && { title: meta.title }),
      ...(meta.description !== undefined && { description: meta.description }),
      ...(meta.instructor !== undefined && { instructor: meta.instructor }),
      ...(meta.price !== undefined && { price: meta.price }),
      ...(meta.originalPrice !== undefined && { originalPrice: meta.originalPrice }),
      ...(meta.plan !== undefined && { plan: meta.plan }),
      ...(meta.skillLevel !== undefined && { skillLevel: meta.skillLevel }),
      ...(meta.totalDuration !== undefined && { totalDuration: meta.totalDuration }),
      ...(meta.bestseller !== undefined && { bestseller: meta.bestseller }),
      ...(meta.whatYouLearn !== undefined && { whatYouLearn: meta.whatYouLearn }),
      ...(meta.categories !== undefined && { categories: meta.categories }),
      ...(meta.published !== undefined && { published: meta.published }),
      ...(meta.scheduledPublishAt !== undefined && {
        scheduledPublishAt: meta.scheduledPublishAt ?? undefined,
      }),
      ...(meta.resources !== undefined && { resources: meta.resources }),
      ...(meta.rating !== undefined && { rating: meta.rating }),
      ...(meta.ratingsCount !== undefined && { ratingsCount: meta.ratingsCount }),
      thumbnail: {
        ...merged.thumbnail,
        ...(meta.thumbnailLabel !== undefined && { label: meta.thumbnailLabel }),
        ...(meta.thumbnailGradient !== undefined && { gradient: meta.thumbnailGradient }),
        ...(meta.thumbnailImageUrl !== undefined && {
          imageUrl: meta.thumbnailImageUrl.trim() || undefined,
        }),
      },
    };
  }

  if (override.addedSections?.length) {
    merged = {
      ...merged,
      sections: [...merged.sections, ...override.addedSections],
    };
  }

  if (override.addedLessons?.length) {
    merged = {
      ...merged,
      sections: merged.sections.map((section) => {
        const extra = override.addedLessons!.filter((item) => item.sectionId === section.id);
        if (!extra.length) return section;
        return { ...section, lessons: [...section.lessons, ...extra.map((item) => item.lesson)] };
      }),
    };
  }

  if (override.lessons) {
    merged = {
      ...merged,
      sections: merged.sections.map((section) => ({
        ...section,
        lessons: section.lessons.map((lesson) => ({
          ...lesson,
          ...override.lessons?.[lesson.id],
        })),
      })),
    };
  }

  if (override.deletedSections?.length) {
    const deleted = new Set(override.deletedSections);
    merged = {
      ...merged,
      sections: merged.sections.filter((section) => !deleted.has(section.id)),
    };
  }

  if (override.deletedLessons?.length) {
    const deleted = new Set(override.deletedLessons);
    merged = {
      ...merged,
      sections: merged.sections.map((section) => ({
        ...section,
        lessons: section.lessons.filter((lesson) => !deleted.has(lesson.id)),
      })),
    };
  }

  merged = applySectionOrder(merged, override.sectionOrder);
  merged = applyLessonOrder(merged, override.lessonOrderBySection);

  return merged;
}

function applyLessonOrder(course: Course, orderBySection?: Record<string, string[]>): Course {
  if (!orderBySection) return course;

  return {
    ...course,
    sections: course.sections.map((section) => {
      const order = orderBySection[section.id];
      if (!order?.length) return section;

      const byId = new Map(section.lessons.map((lesson) => [lesson.id, lesson]));
      const ordered: CourseLesson[] = [];

      for (const lessonId of order) {
        const lesson = byId.get(lessonId);
        if (lesson) {
          ordered.push(lesson);
          byId.delete(lessonId);
        }
      }

      for (const lesson of section.lessons) {
        if (byId.has(lesson.id)) ordered.push(lesson);
      }

      return { ...section, lessons: ordered };
    }),
  };
}

function applySectionOrder(course: Course, sectionOrder?: string[]): Course {
  if (!sectionOrder?.length) return course;

  const byId = new Map(course.sections.map((section) => [section.id, section]));
  const ordered: CourseSection[] = [];

  for (const sectionId of sectionOrder) {
    const section = byId.get(sectionId);
    if (section) {
      ordered.push(section);
      byId.delete(sectionId);
    }
  }

  for (const section of course.sections) {
    if (byId.has(section.id)) ordered.push(section);
  }

  return { ...course, sections: ordered };
}

export async function getCourseOverrides(): Promise<CourseOverridesMap> {
  return readJson<CourseOverridesMap>(COURSE_OVERRIDES_KEY, {});
}

export async function saveCourseOverrides(overrides: CourseOverridesMap) {
  invalidateResolvedCoursesCache();
  return writeJson(COURSE_OVERRIDES_KEY, overrides);
}

export async function getStoredAdminCourses(): Promise<StoredCourse[]> {
  return readJson<StoredCourse[]>(ADMIN_COURSES_KEY, []);
}

export async function saveStoredAdminCourses(courses: StoredCourse[]) {
  invalidateResolvedCoursesCache();
  return writeJson(ADMIN_COURSES_KEY, courses);
}

const RESOLVED_COURSES_TTL_MS = 45_000;
let resolvedCoursesCache: { expiresAt: number; promise: Promise<Course[]> } | null = null;

export function invalidateResolvedCoursesCache(): void {
  resolvedCoursesCache = null;
}

async function resolveCourseListFresh(): Promise<Course[]> {
  const [overrides, stored] = await Promise.all([getCourseOverrides(), getStoredAdminCourses()]);

  const baseResolved = baseCourses.map((course) => mergeCourse(course, overrides[course.slug]));

  const adminResolved = stored.map((storedCourse) => {
    const course = storedCourseToCourse(storedCourse);
    return mergeCourse(course, overrides[course.slug]);
  });

  return [...baseResolved, ...adminResolved];
}

async function resolveCourseList(): Promise<Course[]> {
  const now = Date.now();
  if (resolvedCoursesCache && resolvedCoursesCache.expiresAt > now) {
    return resolvedCoursesCache.promise;
  }

  const promise = resolveCourseListFresh();
  resolvedCoursesCache = { expiresAt: now + RESOLVED_COURSES_TTL_MS, promise };
  return promise;
}

export async function getResolvedCourses(): Promise<Course[]> {
  return resolveCourseList();
}

export async function getPublishedCourses(): Promise<Course[]> {
  const all = await resolveCourseList();
  const seen = new Set<string>();
  return all.filter((course) => {
    if (!isCourseListed(course)) return false;
    if (seen.has(course.slug)) return false;
    seen.add(course.slug);
    return true;
  });
}

export async function getPublishedCourseCount(): Promise<number> {
  const courses = await getPublishedCourses();
  return courses.length;
}

export async function getResolvedCourseBySlug(
  slug: string,
  options?: { fresh?: boolean },
): Promise<Course | undefined> {
  if (options?.fresh) {
    invalidateResolvedCoursesCache();
  }
  const all = options?.fresh ? await resolveCourseListFresh() : await getResolvedCourses();
  const course = all.find((item) => item.slug === slug);
  if (!course) return undefined;

  const { enrichCourseWithVideoDurations } = await import("@/server/course-video-durations");
  return enrichCourseWithVideoDurations(course);
}

export function getDefaultSiteSettings(): SiteSettings {
  return {
    cohortStartDate: siteConfig.cohortStartDate,
    statsStudentsBase: siteConfig.stats.studentsBase,
    promoEnabled: siteConfig.promo.enabled,
    promoMessage: siteConfig.promo.message,
    promoMessageShort: siteConfig.promo.messageShort,
  };
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const stored = await readJson<SiteSettings>(SITE_SETTINGS_KEY, {});
  const defaults = getDefaultSiteSettings();
  return {
    ...defaults,
    ...stored,
    cohortStartDate: stored.cohortStartDate?.trim() || defaults.cohortStartDate,
    statsStudentsBase:
      typeof stored.statsStudentsBase === "number" && stored.statsStudentsBase > 0
        ? stored.statsStudentsBase
        : defaults.statsStudentsBase,
    promoMessage: stored.promoMessage?.trim() || defaults.promoMessage,
    promoMessageShort: stored.promoMessageShort?.trim() || defaults.promoMessageShort,
  };
}

export async function saveSiteSettings(settings: SiteSettings) {
  return writeJson(SITE_SETTINGS_KEY, settings);
}

export async function getResolvedCourseCategories() {
  const { DEFAULT_COURSE_CATEGORIES, sanitizeCategoryList } =
    await import("@/lib/course-categories");
  const stored = await readJson<unknown>(COURSE_CATEGORIES_KEY, null);
  const custom = sanitizeCategoryList(stored);
  return custom.length > 0 ? custom : [...DEFAULT_COURSE_CATEGORIES];
}

export async function saveCourseCategories(
  categories: Array<{ id: string; label: string }>,
) {
  const { sanitizeCategoryList } = await import("@/lib/course-categories");
  const cleaned = sanitizeCategoryList(categories);
  if (cleaned.length === 0) {
    return { ok: false as const, reason: "Ajoutez au moins une catÃÂÃÂ©gorie" };
  }
  const result = await writeJson(COURSE_CATEGORIES_KEY, cleaned);
  if (!result.ok) {
    return { ok: false as const, reason: result.reason ?? "Sauvegarde impossible" };
  }
  return { ok: true as const, categories: cleaned };
}

export async function updateLessonOverride(params: {
  courseSlug: string;
  lessonId: string;
  patch: CourseLessonOverride;
}) {
  const cleanPatch = Object.fromEntries(
    Object.entries(params.patch).filter(([, value]) => value !== undefined),
  ) as CourseLessonOverride;

  if (isBaseCourseSlug(params.courseSlug)) {
    const overrides = await getCourseOverrides();
    const courseOverride = overrides[params.courseSlug] ?? { lessons: {} };
    const addedLessons = courseOverride.addedLessons ?? [];
    const addedIndex = addedLessons.findIndex((item) => item.lesson.id === params.lessonId);

    if (addedIndex !== -1) {
      const nextAddedLessons = [...addedLessons];
      nextAddedLessons[addedIndex] = {
        ...nextAddedLessons[addedIndex],
        lesson: { ...nextAddedLessons[addedIndex].lesson, ...cleanPatch },
      };
      overrides[params.courseSlug] = { ...courseOverride, addedLessons: nextAddedLessons };
      return saveCourseOverrides(overrides);
    }

    const lessons = courseOverride.lessons ?? {};

    lessons[params.lessonId] = {
      ...lessons[params.lessonId],
      ...cleanPatch,
    };

    overrides[params.courseSlug] = { ...courseOverride, lessons };
    return saveCourseOverrides(overrides);
  }

  const stored = await getStoredAdminCourses();
  const index = stored.findIndex((course) => course.slug === params.courseSlug);
  if (index === -1) {
    return { ok: false, reason: "Cours introuvable" };
  }

  stored[index] = patchLessonInStoredCourse(stored[index], params.lessonId, cleanPatch);
  return saveStoredAdminCourses(stored);
}

export async function updateCourseMeta(params: { courseSlug: string; patch: CourseMetaPatch }) {
  const cleanPatch = Object.fromEntries(
    Object.entries(params.patch).filter(([, value]) => value !== undefined),
  ) as CourseMetaPatch;

  if (Object.keys(cleanPatch).length === 0) {
    return { ok: false, reason: "Aucune modification" };
  }

  if (isBaseCourseSlug(params.courseSlug)) {
    const overrides = await getCourseOverrides();
    const courseOverride = overrides[params.courseSlug] ?? {};
    overrides[params.courseSlug] = {
      ...courseOverride,
      meta: { ...courseOverride.meta, ...cleanPatch },
    };
    return saveCourseOverrides(overrides);
  }

  const stored = await getStoredAdminCourses();
  const index = stored.findIndex((course) => course.slug === params.courseSlug);
  if (index === -1) {
    return { ok: false, reason: "Cours introuvable" };
  }

  stored[index] = patchStoredCourseMeta(stored[index], cleanPatch);
  return saveStoredAdminCourses(stored);
}

export async function addLessonToCourse(params: { courseSlug: string; input: AddLessonInput }) {
  const title = params.input.title.trim();
  if (!title) {
    return { ok: false, reason: "Titre requis" };
  }

  const lesson = buildNewLesson({ ...params.input, title });

  if (isBaseCourseSlug(params.courseSlug)) {
    const base = baseCourses.find((course) => course.slug === params.courseSlug);
    if (!base) {
      return { ok: false, reason: "Cours introuvable" };
    }

    const overrides = await getCourseOverrides();
    const merged = mergeCourse(base, overrides[params.courseSlug]);
    if (!merged.sections.some((section) => section.id === params.input.sectionId)) {
      return { ok: false, reason: "Section introuvable" };
    }

    const courseOverride = overrides[params.courseSlug] ?? {};
    const addedLessons = [
      ...(courseOverride.addedLessons ?? []),
      { sectionId: params.input.sectionId, lesson },
    ];
    overrides[params.courseSlug] = { ...courseOverride, addedLessons };
    const result = await saveCourseOverrides(overrides);
    if (!result.ok) return result;
    return { ok: true as const, lessonId: lesson.id };
  }

  const stored = await getStoredAdminCourses();
  const index = stored.findIndex((course) => course.slug === params.courseSlug);
  if (index === -1) {
    return { ok: false, reason: "Cours introuvable" };
  }

  const next = addLessonToStoredCourse(stored[index], params.input.sectionId, lesson);
  if (!next) {
    return { ok: false, reason: "Section introuvable" };
  }

  stored[index] = next;
  const result = await saveStoredAdminCourses(stored);
  if (!result.ok) return result;
  return { ok: true as const, lessonId: lesson.id };
}

export async function addSectionToCourse(params: { courseSlug: string; title: string }) {
  const title = params.title.trim();
  if (!title) {
    return { ok: false, reason: "Titre requis" };
  }

  const section = buildNewSection(title);

  if (isBaseCourseSlug(params.courseSlug)) {
    const overrides = await getCourseOverrides();
    const courseOverride = overrides[params.courseSlug] ?? {};
    const addedSections = [...(courseOverride.addedSections ?? []), section];
    overrides[params.courseSlug] = { ...courseOverride, addedSections };
    const result = await saveCourseOverrides(overrides);
    if (!result.ok) return result;
    return { ok: true as const, sectionId: section.id };
  }

  const stored = await getStoredAdminCourses();
  const index = stored.findIndex((course) => course.slug === params.courseSlug);
  if (index === -1) {
    return { ok: false, reason: "Cours introuvable" };
  }

  stored[index] = addSectionToStoredCourse(stored[index], section);
  const result = await saveStoredAdminCourses(stored);
  if (!result.ok) return result;
  return { ok: true as const, sectionId: section.id };
}

export async function deleteLessonFromCourse(params: { courseSlug: string; lessonId: string }) {
  const lessonId = params.lessonId.trim();
  if (!lessonId) {
    return { ok: false, reason: "LeÃÂÃÂ§on introuvable" };
  }

  if (isBaseCourseSlug(params.courseSlug)) {
    const overrides = await getCourseOverrides();
    const courseOverride = overrides[params.courseSlug] ?? {};
    const addedLessons = (courseOverride.addedLessons ?? []).filter(
      (item) => item.lesson.id !== lessonId,
    );
    const wasAdded = addedLessons.length !== (courseOverride.addedLessons ?? []).length;
    const deletedLessons = new Set(courseOverride.deletedLessons ?? []);

    if (!wasAdded) {
      deletedLessons.add(lessonId);
    }

    const lessons = { ...(courseOverride.lessons ?? {}) };
    delete lessons[lessonId];

    overrides[params.courseSlug] = {
      ...courseOverride,
      addedLessons,
      deletedLessons: [...deletedLessons],
      lessons,
    };
    const result = await saveCourseOverrides(overrides);
    if (!result.ok) return result;
    return { ok: true as const };
  }

  const stored = await getStoredAdminCourses();
  const index = stored.findIndex((course) => course.slug === params.courseSlug);
  if (index === -1) {
    return { ok: false, reason: "Cours introuvable" };
  }

  const hasLesson = stored[index].sections.some((section) =>
    section.lessons.some((lesson) => lesson.id === lessonId),
  );
  if (!hasLesson) {
    return { ok: false, reason: "LeÃÂÃÂ§on introuvable" };
  }

  stored[index] = deleteLessonFromStoredCourse(stored[index], lessonId);
  const result = await saveStoredAdminCourses(stored);
  if (!result.ok) return result;
  return { ok: true as const };
}

export async function deleteSectionFromCourse(params: { courseSlug: string; sectionId: string }) {
  const sectionId = params.sectionId.trim();
  if (!sectionId) {
    return { ok: false, reason: "Session introuvable" };
  }

  if (isBaseCourseSlug(params.courseSlug)) {
    const base = baseCourses.find((course) => course.slug === params.courseSlug);
    if (!base) {
      return { ok: false, reason: "Cours introuvable" };
    }

    const overrides = await getCourseOverrides();
    const courseOverride = overrides[params.courseSlug] ?? {};
    const addedSections = (courseOverride.addedSections ?? []).filter(
      (section) => section.id !== sectionId,
    );
    const wasAdded = addedSections.length !== (courseOverride.addedSections ?? []).length;
    const deletedSections = new Set(courseOverride.deletedSections ?? []);

    if (!wasAdded) {
      if (!base.sections.some((section) => section.id === sectionId)) {
        return { ok: false, reason: "Session introuvable" };
      }
      deletedSections.add(sectionId);
    }

    const addedLessons = (courseOverride.addedLessons ?? []).filter(
      (item) => item.sectionId !== sectionId,
    );

    const nextOverride: CourseOverride = {
      ...courseOverride,
      addedSections,
      deletedSections: [...deletedSections],
      addedLessons,
    };

    const remainingSections = mergeCourse(base, nextOverride).sections.length;
    if (remainingSections === 0) {
      overrides[params.courseSlug] = {
        ...nextOverride,
        addedSections: [...addedSections, buildNewSection("Introduction")],
      };
      const result = await saveCourseOverrides(overrides);
      if (!result.ok) return result;
      return { ok: true as const };
    }

    overrides[params.courseSlug] = nextOverride;
    const result = await saveCourseOverrides(overrides);
    if (!result.ok) return result;
    return { ok: true as const };
  }

  const stored = await getStoredAdminCourses();
  const index = stored.findIndex((course) => course.slug === params.courseSlug);
  if (index === -1) {
    return { ok: false, reason: "Cours introuvable" };
  }

  const next = deleteSectionFromStoredCourse(stored[index], sectionId);
  if (!next) {
    return { ok: false, reason: "Session introuvable" };
  }

  stored[index] = next;
  const result = await saveStoredAdminCourses(stored);
  if (!result.ok) return result;
  return { ok: true as const };
}

export async function reorderLessonsInCourse(params: {
  courseSlug: string;
  sectionId: string;
  lessonIds: string[];
}) {
  const sectionId = params.sectionId.trim();
  const lessonIds = params.lessonIds.map((id) => id.trim()).filter(Boolean);
  if (!sectionId || !lessonIds.length) {
    return { ok: false, reason: "Ordre invalide" };
  }

  if (isBaseCourseSlug(params.courseSlug)) {
    const base = baseCourses.find((course) => course.slug === params.courseSlug);
    if (!base) {
      return { ok: false, reason: "Cours introuvable" };
    }

    const overrides = await getCourseOverrides();
    const merged = mergeCourse(base, overrides[params.courseSlug]);
    const section = merged.sections.find((item) => item.id === sectionId);
    if (!section) {
      return { ok: false, reason: "Session introuvable" };
    }

    const currentIds = section.lessons.map((lesson) => lesson.id);
    if (
      lessonIds.length !== currentIds.length ||
      !lessonIds.every((id) => currentIds.includes(id))
    ) {
      return { ok: false, reason: "Ordre invalide" };
    }

    const courseOverride = overrides[params.courseSlug] ?? {};
    overrides[params.courseSlug] = {
      ...courseOverride,
      lessonOrderBySection: {
        ...(courseOverride.lessonOrderBySection ?? {}),
        [sectionId]: lessonIds,
      },
    };

    const result = await saveCourseOverrides(overrides);
    if (!result.ok) return result;
    return { ok: true as const };
  }

  const stored = await getStoredAdminCourses();
  const index = stored.findIndex((course) => course.slug === params.courseSlug);
  if (index === -1) {
    return { ok: false, reason: "Cours introuvable" };
  }

  const next = reorderLessonsInStoredCourse(stored[index], sectionId, lessonIds);
  if (!next) {
    return { ok: false, reason: "Ordre invalide" };
  }

  stored[index] = next;
  const result = await saveStoredAdminCourses(stored);
  if (!result.ok) return result;
  return { ok: true as const };
}

export async function reorderSectionsInCourse(params: {
  courseSlug: string;
  sectionIds: string[];
}) {
  const sectionIds = params.sectionIds.map((id) => id.trim()).filter(Boolean);
  if (!sectionIds.length) {
    return { ok: false, reason: "Ordre invalide" };
  }

  if (isBaseCourseSlug(params.courseSlug)) {
    const base = baseCourses.find((course) => course.slug === params.courseSlug);
    if (!base) {
      return { ok: false, reason: "Cours introuvable" };
    }

    const overrides = await getCourseOverrides();
    const merged = mergeCourse(base, overrides[params.courseSlug]);
    const currentIds = merged.sections.map((section) => section.id);
    if (
      sectionIds.length !== currentIds.length ||
      !sectionIds.every((id) => currentIds.includes(id))
    ) {
      return { ok: false, reason: "Ordre invalide" };
    }

    const courseOverride = overrides[params.courseSlug] ?? {};
    overrides[params.courseSlug] = {
      ...courseOverride,
      sectionOrder: sectionIds,
    };

    const result = await saveCourseOverrides(overrides);
    if (!result.ok) return result;
    return { ok: true as const };
  }

  const stored = await getStoredAdminCourses();
  const index = stored.findIndex((course) => course.slug === params.courseSlug);
  if (index === -1) {
    return { ok: false, reason: "Cours introuvable" };
  }

  const next = reorderSectionsInStoredCourse(stored[index], sectionIds);
  if (!next) {
    return { ok: false, reason: "Ordre invalide" };
  }

  stored[index] = next;
  const result = await saveStoredAdminCourses(stored);
  if (!result.ok) return result;
  return { ok: true as const };
}

export async function createAdminCourse(input: CreateCourseInput) {
  const slug = input.slug.trim().toLowerCase();
  if (!slug) {
    return { ok: false as const, reason: "Slug requis" };
  }

  if (isBaseCourseSlug(slug)) {
    return { ok: false as const, reason: "Ce slug est rÃÂÃÂ©servÃÂÃÂ© au cours de base" };
  }

  const existing = await resolveCourseList();
  if (existing.some((course) => course.slug === slug)) {
    return { ok: false as const, reason: "Un cours avec ce slug existe dÃÂÃÂ©jÃÂÃÂ " };
  }

  const course = buildDefaultStoredCourse({ ...input, slug });
  const stored = await getStoredAdminCourses();
  stored.push(course);

  const result = await saveStoredAdminCourses(stored);
  if (!result.ok) return result;

  return { ok: true as const, course: storedCourseToCourse(course) };
}

export async function deleteAdminCourse(slug: string) {
  if (isBaseCourseSlug(slug)) {
    return { ok: false as const, reason: "Le cours de base ne peut pas ÃÂÃÂªtre supprimÃÂÃÂ©" };
  }

  const stored = await getStoredAdminCourses();
  const next = stored.filter((course) => course.slug !== slug);
  if (next.length === stored.length) {
    return { ok: false as const, reason: "Cours introuvable" };
  }

  const result = await saveStoredAdminCourses(next);
  if (!result.ok) return result;

  const overrides = await getCourseOverrides();
  if (overrides[slug]) {
    delete overrides[slug];
    await saveCourseOverrides(overrides);
  }

  return { ok: true as const };
}

export async function getStoredServices(): Promise<StoredService[]> {
  return readJson<StoredService[]>(ADMIN_SERVICES_KEY, []);
}

export async function saveStoredServices(services: StoredService[]) {
  return writeJson(ADMIN_SERVICES_KEY, services);
}

async function sortServices(services: StoredService[]): Promise<StoredService[]> {
  return [...services].sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function ensureServicesInitialized(): Promise<StoredService[]> {
  const stored = await getStoredServices();
  if (stored.length > 0) return sortServices(stored);

  const defaults = getDefaultServices();
  await saveStoredServices(defaults);
  return defaults;
}

export async function getResolvedServices(): Promise<StoredService[]> {
  const stored = await getStoredServices();
  if (stored.length > 0) return sortServices(stored);
  return getDefaultServices();
}

export async function getPublishedServices(): Promise<StoredService[]> {
  const all = await getResolvedServices();
  return all.filter((service) => service.published !== false);
}

export async function getResolvedServiceBySlug(slug: string): Promise<StoredService | undefined> {
  const all = await getResolvedServices();
  return all.find((service) => service.slug === slug);
}

export async function createAdminService(input: CreateServiceInput) {
  const title = input.title.trim();
  if (!title) {
    return { ok: false as const, reason: "Titre requis" };
  }

  const stored = await ensureServicesInitialized();
  const service = buildNewService(input, stored);
  stored.push(service);

  const result = await saveStoredServices(stored);
  if (!result.ok) return result;

  return { ok: true as const, service };
}

export async function updateAdminService(slug: string, patch: ServicePatch) {
  const stored = await ensureServicesInitialized();
  const index = stored.findIndex((service) => service.slug === slug);
  if (index === -1) {
    return { ok: false as const, reason: "Service introuvable" };
  }

  stored[index] = patchStoredService(stored[index], patch);
  const result = await saveStoredServices(stored);
  if (!result.ok) return result;

  return { ok: true as const, service: stored[index] };
}

export async function deleteAdminService(slug: string) {
  const stored = await ensureServicesInitialized();
  const next = stored.filter((service) => service.slug !== slug);
  if (next.length === stored.length) {
    return { ok: false as const, reason: "Service introuvable" };
  }

  const result = await saveStoredServices(next);
  if (!result.ok) return result;

  return { ok: true as const };
}

const SERVICE_BOOKINGS_KEY = "service_bookings";
let devServiceBookings: import("@/lib/service-booking-storage").ServiceBookingRecord[] = [];

export async function getServiceBookings(): Promise<
  import("@/lib/service-booking-storage").ServiceBookingRecord[]
> {
  const sb = getSupabaseAdmin();
  if (!sb) return [...devServiceBookings];
  return readJson<import("@/lib/service-booking-storage").ServiceBookingRecord[]>(
    SERVICE_BOOKINGS_KEY,
    [],
  );
}

async function saveServiceBookings(
  bookings: import("@/lib/service-booking-storage").ServiceBookingRecord[],
) {
  const sb = getSupabaseAdmin();
  if (!sb) {
    devServiceBookings = [...bookings];
    return { ok: true as const };
  }
  return writeJson(SERVICE_BOOKINGS_KEY, bookings);
}

export type CreateServiceBookingInput = {
  serviceSlug: string;
  serviceTitle: string;
  name: string;
  email: string;
  phone: string;
  preferredDate: string;
  preferredTime: string;
  message?: string;
};

export async function createServiceBooking(input: CreateServiceBookingInput) {
  const bookings = await getServiceBookings();
  const record: import("@/lib/service-booking-storage").ServiceBookingRecord = {
    id: crypto.randomUUID(),
    serviceSlug: input.serviceSlug,
    serviceTitle: input.serviceTitle,
    name: input.name.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    preferredDate: input.preferredDate,
    preferredTime: input.preferredTime,
    message: input.message?.trim() || undefined,
    status: "new",
    createdAt: new Date().toISOString(),
  };
  bookings.unshift(record);
  const result = await saveServiceBookings(bookings);
  if (!result.ok) return result;
  return { ok: true as const, booking: record };
}

export async function updateServiceBookingStatus(
  id: string,
  status: import("@/lib/service-booking-storage").ServiceBookingStatus,
) {
  const bookings = await getServiceBookings();
  const index = bookings.findIndex((booking) => booking.id === id);
  if (index === -1) {
    return { ok: false as const, reason: "Demande introuvable" };
  }
  bookings[index] = { ...bookings[index], status };
  const result = await saveServiceBookings(bookings);
  if (!result.ok) return result;
  return { ok: true as const, booking: bookings[index] };
}

const BLOG_POSTS_KEY = "blog_posts";
const BLOG_SEED_IMPORT_META_KEY = "blog_seed_import_meta";

export async function getStoredBlogPosts(): Promise<
  import("@/lib/blog-blocks").StoredBlogPost[]
> {
  const { sanitizeStoredPost, seedStoredPostsFromStatic } = await import(
    "@/lib/blog-storage"
  );
  const stored = await readJson<unknown>(BLOG_POSTS_KEY, null);
  const seed = seedStoredPostsFromStatic();

  // Seed vide = blog géré uniquement à la main (pas de re-remplissage auto).
  if (!Array.isArray(stored) || stored.length === 0) {
    if (!seed.length) return [];
    try {
      await writeJson(BLOG_POSTS_KEY, seed);
    } catch {
      /* lecture publique OK même si la persistance seed échoue */
    }
    return seed;
  }
  const cleaned = stored
    .map((item) => sanitizeStoredPost(item))
    .filter((item): item is import("@/lib/blog-blocks").StoredBlogPost => Boolean(item));
  if (!cleaned.length) {
    if (!seed.length) return [];
    try {
      await writeJson(BLOG_POSTS_KEY, seed);
    } catch {
      /* ignore */
    }
    return seed;
  }
  return cleaned;
}

/** Vide complètement le blog CMS (Supabase). */
export async function clearAllStoredBlogPosts() {
  const result = await saveStoredBlogPosts([]);
  if (!result.ok) return result;
  await writeJson(BLOG_SEED_IMPORT_META_KEY, {
    importedAt: new Date().toISOString(),
    count: 0,
    ids: [],
    cleared: true,
  });
  return { ok: true as const, posts: [] as import("@/lib/blog-blocks").StoredBlogPost[] };
}

export async function saveStoredBlogPosts(
  posts: import("@/lib/blog-blocks").StoredBlogPost[],
) {
  const { sanitizeStoredPost } = await import("@/lib/blog-storage");
  const cleaned = posts
    .map((item) => sanitizeStoredPost(item))
    .filter((item): item is import("@/lib/blog-blocks").StoredBlogPost => Boolean(item));
  const result = await writeJson(BLOG_POSTS_KEY, cleaned);
  if (!result.ok) {
    return { ok: false as const, reason: result.reason ?? "Sauvegarde impossible" };
  }
  return { ok: true as const, posts: cleaned };
}

export async function upsertStoredBlogPost(
  post: import("@/lib/blog-blocks").StoredBlogPost,
) {
  const { sanitizeStoredPost, estimateReadMinutes } = await import("@/lib/blog-storage");
  const cleaned = sanitizeStoredPost({
    ...post,
    updatedAt: new Date().toISOString(),
    readMinutes: post.readMinutes || estimateReadMinutes(post.blocks ?? []),
  });
  if (!cleaned) {
    return { ok: false as const, reason: "Article invalide" };
  }
  const posts = await getStoredBlogPosts();
  const index = posts.findIndex((item) => item.id === cleaned.id);
  const slugClash = posts.find(
    (item) => item.slug === cleaned.slug && item.id !== cleaned.id,
  );
  if (slugClash) {
    return { ok: false as const, reason: `Slug dÃÂ©jÃÂ  utilisÃÂ© par ÃÂ« ${slugClash.title} ÃÂ»` };
  }
  if (index >= 0) posts[index] = cleaned;
  else posts.unshift(cleaned);
  const result = await saveStoredBlogPosts(posts);
  if (!result.ok) return result;
  return { ok: true as const, post: cleaned, posts: result.posts };
}

export async function deleteStoredBlogPost(id: string) {
  const posts = await getStoredBlogPosts();
  const next = posts.filter((item) => item.id !== id);
  if (next.length === posts.length) {
    return { ok: false as const, reason: "Article introuvable" };
  }
  return saveStoredBlogPosts(next);
}

export async function getPublishedBlogPosts() {
  const posts = await getStoredBlogPosts();
  const now = Date.now();
  return posts.filter((post) => {
    if (post.status === "published") return true;
    if (post.status === "scheduled" && post.scheduledAt) {
      return Date.parse(post.scheduledAt) <= now;
    }
    return false;
  });
}

export async function getPublishedBlogPostBySlug(slug: string) {
  const posts = await getPublishedBlogPosts();
  return posts.find((post) => post.slug === slug) ?? null;
}

function htmlLooksCmsCustomized(html: string): boolean {
  if (!html.trim()) return false;
  if (/\/storage\/v1\/object\/public\/blog-images\//i.test(html)) return true;
  if (/<img\b/i.test(html)) return true;
  return false;
}

/**
 * Remplace le blog CMS par le seed, en préservant couvertures / HTML custom
 * (images uploadées) et les articles hors seed déjà présents.
 */
export async function mergeAstucesSeedPosts() {
  const {
    sanitizeStoredPost,
    seedStoredPostsFromStatic,
    getPostContentHtml,
  } = await import("@/lib/blog-storage");
  const tipSeeds = seedStoredPostsFromStatic()
    .map((item) => sanitizeStoredPost(item))
    .filter((item): item is import("@/lib/blog-blocks").StoredBlogPost => Boolean(item));
  if (!tipSeeds.length) {
    return { ok: false as const, reason: "Aucune astuce seed disponible" };
  }

  const existing = await getStoredBlogPosts();
  const existingById = new Map(existing.map((post) => [post.id, post]));
  const seedIds = new Set(tipSeeds.map((post) => post.id));

  const merged = tipSeeds.map((seed) => {
    const prev = existingById.get(seed.id);
    if (!prev) return seed;

    const prevHtml = getPostContentHtml(prev);
    const keepBlocks = htmlLooksCmsCustomized(prevHtml);
    return sanitizeStoredPost({
      ...seed,
      coverImageUrl: prev.coverImageUrl || seed.coverImageUrl,
      coverAlt: prev.coverAlt || seed.coverAlt,
      blocks: keepBlocks ? prev.blocks : seed.blocks,
      updatedAt: keepBlocks || prev.coverImageUrl ? prev.updatedAt : seed.updatedAt,
    })!;
  });

  // Garder les articles créés à la main (hors pack seed).
  for (const post of existing) {
    if (!seedIds.has(post.id)) merged.push(post);
  }

  const saved = await saveStoredBlogPosts(merged);
  if (!saved.ok) return saved;
  const importedAt = new Date().toISOString();
  await writeJson(BLOG_SEED_IMPORT_META_KEY, {
    importedAt,
    count: tipSeeds.length,
    ids: tipSeeds.map((p) => p.id),
  });
  return { ...saved, importedAt, importedCount: tipSeeds.length };
}

/** Réattache couvertures + images corps depuis le bucket blog-images. */
export async function recoverBlogImagesFromStorage() {
  const { listBlogStorageImages, isBlogStorageImageUrl } = await import(
    "@/server/blog-image-storage"
  );
  const { getPostContentHtml, withPostContentHtml, sanitizeStoredPost } = await import(
    "@/lib/blog-storage"
  );

  const listed = await listBlogStorageImages();
  if (!listed.ok) {
    return { ok: false as const, reason: listed.reason };
  }

  const byPost = new Map<string, typeof listed.images>();
  for (const image of listed.images) {
    const bucket = byPost.get(image.postId) ?? [];
    bucket.push(image);
    byPost.set(image.postId, bucket);
  }

  const posts = await getStoredBlogPosts();
  let coversRestored = 0;
  let bodiesRestored = 0;
  const next = posts.map((post) => {
    const folderKey = post.id.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-");
    const images = byPost.get(folderKey) ?? byPost.get(post.id) ?? [];
    if (!images.length) return post;

    let updated = post;
    if (!updated.coverImageUrl) {
      updated = { ...updated, coverImageUrl: images[0]!.publicUrl };
      coversRestored += 1;
    }

    const html = getPostContentHtml(updated);
    const hasAnyStorageImg = isBlogStorageImageUrl(html) || /blog-images\//i.test(html);
    if (!hasAnyStorageImg) {
      const bodyImages = images.filter((img) => img.publicUrl !== updated.coverImageUrl);
      if (bodyImages.length) {
        const figures = bodyImages
          .map(
            (img) =>
              `<figure class="blog-media"><img src="${img.publicUrl}" alt="" loading="lazy" /></figure>`,
          )
          .join("\n");
        updated = withPostContentHtml(updated, `${html.trim()}\n${figures}`);
        bodiesRestored += 1;
      }
    }

    return sanitizeStoredPost(updated) ?? post;
  });

  const saved = await saveStoredBlogPosts(next);
  if (!saved.ok) return saved;
  return {
    ok: true as const,
    posts: saved.posts,
    foldersFound: byPost.size,
    imagesFound: listed.images.length,
    coversRestored,
    bodiesRestored,
  };
}

export async function getBlogSeedImportStatus() {
  const { seedStoredPostsFromStatic, sanitizeStoredPost } = await import(
    "@/lib/blog-storage"
  );
  const seed = seedStoredPostsFromStatic()
    .map((item) => sanitizeStoredPost(item))
    .filter((item): item is import("@/lib/blog-blocks").StoredBlogPost => Boolean(item));
  const posts = await getStoredBlogPosts();
  const seedIds = new Set(seed.map((p) => p.id));
  const cmsIds = new Set(posts.map((p) => p.id));
  const missingFromCms = [...seedIds].filter((id) => !cmsIds.has(id));
  const extraInCms = [...cmsIds].filter((id) => !seedIds.has(id));
  const inSync = missingFromCms.length === 0 && seed.length > 0;
  const meta = await readJson<{ importedAt?: string; count?: number } | null>(
    BLOG_SEED_IMPORT_META_KEY,
    null,
  );
  return {
    seedCount: seed.length,
    cmsCount: posts.length,
    inSync,
    missingFromCms: missingFromCms.length,
    extraInCms: extraInCms.length,
    lastImportedAt: meta?.importedAt ?? null,
  };
}

const BLOG_CATEGORIES_KEY = "blog_categories";

export async function getResolvedBlogCategories() {
  const { DEFAULT_BLOG_CATEGORIES, sanitizeBlogCategoryList } = await import(
    "@/lib/blog-categories"
  );
  const stored = await readJson<unknown>(BLOG_CATEGORIES_KEY, null);
  const custom = sanitizeBlogCategoryList(stored);
  return custom.length > 0 ? custom : [...DEFAULT_BLOG_CATEGORIES];
}

export async function saveBlogCategories(
  categories: Array<{ id: string; label: string }>,
) {
  const { sanitizeBlogCategoryList } = await import("@/lib/blog-categories");
  const cleaned = sanitizeBlogCategoryList(categories);
  if (cleaned.length === 0) {
    return { ok: false as const, reason: "Ajoutez au moins une catÃ©gorie" };
  }
  const result = await writeJson(BLOG_CATEGORIES_KEY, cleaned);
  if (!result.ok) {
    return { ok: false as const, reason: result.reason ?? "Sauvegarde impossible" };
  }
  return { ok: true as const, categories: cleaned };
}
