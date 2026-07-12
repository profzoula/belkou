import type { Course, CourseLesson, CourseSection } from "@/lib/courses";
import { courses as baseCourses, getAllLessons, isBaseCourseSlug, isWelcomePreviewLesson } from "@/lib/courses";
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
  Pick<CourseLesson, "videoId" | "preview" | "title" | "duration" | "content" | "type">
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

  const { data, error } = await sb.from("site_content").select("value").eq("key", key).maybeSingle();

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
    return { ok: false, reason: "Supabase non configuré (SUPABASE_SERVICE_ROLE_KEY)" };
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
      return { ok: false, reason: "Table site_content manquante — exécutez supabase/site_content.sql" };
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
  return writeJson(COURSE_OVERRIDES_KEY, overrides);
}

export async function getStoredAdminCourses(): Promise<StoredCourse[]> {
  return readJson<StoredCourse[]>(ADMIN_COURSES_KEY, []);
}

export async function saveStoredAdminCourses(courses: StoredCourse[]) {
  return writeJson(ADMIN_COURSES_KEY, courses);
}

async function resolveCourseList(): Promise<Course[]> {
  const [overrides, stored] = await Promise.all([getCourseOverrides(), getStoredAdminCourses()]);

  const baseResolved = baseCourses.map((course) => mergeCourse(course, overrides[course.slug]));

  const adminResolved = stored.map((storedCourse) => {
    const course = storedCourseToCourse(storedCourse);
    return mergeCourse(course, overrides[course.slug]);
  });

  return [...baseResolved, ...adminResolved];
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

export async function getResolvedCourseBySlug(slug: string): Promise<Course | undefined> {
  const all = await getResolvedCourses();
  return all.find((course) => course.slug === slug);
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
    const addedLessons = [...(courseOverride.addedLessons ?? []), { sectionId: params.input.sectionId, lesson }];
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
    return { ok: false, reason: "Leçon introuvable" };
  }

  if (isBaseCourseSlug(params.courseSlug)) {
    const overrides = await getCourseOverrides();
    const courseOverride = overrides[params.courseSlug] ?? {};
    const addedLessons = (courseOverride.addedLessons ?? []).filter((item) => item.lesson.id !== lessonId);
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
    return { ok: false, reason: "Leçon introuvable" };
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
    return { ok: false as const, reason: "Ce slug est réservé au cours de base" };
  }

  const existing = await resolveCourseList();
  if (existing.some((course) => course.slug === slug)) {
    return { ok: false as const, reason: "Un cours avec ce slug existe déjà" };
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
    return { ok: false as const, reason: "Le cours de base ne peut pas être supprimé" };
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
