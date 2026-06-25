import type { Course, CourseLesson, CourseSection } from "@/lib/courses";
import { courses as baseCourses, DEFAULT_PREVIEW_VIMEO, isBaseCourseSlug } from "@/lib/courses";
import {
  addLessonToStoredCourse,
  addSectionToStoredCourse,
  buildDefaultStoredCourse,
  buildNewSection,
  buildNewVideoLesson,
  deleteLessonFromStoredCourse,
  patchLessonInStoredCourse,
  patchStoredCourseMeta,
  storedCourseToCourse,
  type AddLessonInput,
  type CourseMetaPatch,
  type CreateCourseInput,
  type StoredCourse,
} from "@/lib/course-storage";
import { siteConfig } from "@/lib/site-config";
import { getSupabaseAdmin } from "@/server/supabase-registrations";

export type CourseLessonOverride = Partial<Pick<CourseLesson, "vimeo" | "preview" | "title" | "duration">>;

export type CourseMetaOverride = CourseMetaPatch;

export type CourseOverride = {
  meta?: CourseMetaOverride;
  lessons?: Record<string, CourseLessonOverride>;
  addedLessons?: Array<{ sectionId: string; lesson: CourseLesson }>;
  addedSections?: CourseSection[];
  deletedLessons?: string[];
};

export type CourseOverridesMap = Record<string, CourseOverride>;

import type { SiteSettings } from "@/lib/site-settings";

const COURSE_OVERRIDES_KEY = "course_overrides";
const ADMIN_COURSES_KEY = "admin_courses";
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

  const { error } = await sb.from("site_content").upsert({
    key,
    value,
    updated_at: new Date().toISOString(),
  });

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
      ...(meta.published !== undefined && { published: meta.published }),
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

  if (override.addedSections?.length) {
    merged = {
      ...merged,
      sections: [...merged.sections, ...override.addedSections],
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

  return merged;
}

function applyDefaultVimeo(course: Course, defaultVimeo?: string): Course {
  if (!defaultVimeo) return course;

  return {
    ...course,
    sections: course.sections.map((section) => ({
      ...section,
      lessons: section.lessons.map((lesson) => {
        if (lesson.preview && !lesson.vimeo && lesson.type === "video") {
          return { ...lesson, vimeo: defaultVimeo };
        }
        return lesson;
      }),
    })),
  };
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
  const [overrides, settings, stored] = await Promise.all([
    getCourseOverrides(),
    getSiteSettings(),
    getStoredAdminCourses(),
  ]);
  const defaultVimeo = settings.vimeoPreviewDefault?.trim();

  const baseResolved = baseCourses.map((course) =>
    applyDefaultVimeo(mergeCourse(course, overrides[course.slug]), defaultVimeo),
  );

  const adminResolved = stored.map((storedCourse) => {
    const course = storedCourseToCourse(storedCourse);
    return applyDefaultVimeo(mergeCourse(course, overrides[course.slug]), defaultVimeo);
  });

  return [...baseResolved, ...adminResolved];
}

export async function getResolvedCourses(): Promise<Course[]> {
  return resolveCourseList();
}

export async function getPublishedCourses(): Promise<Course[]> {
  const all = await resolveCourseList();
  return all.filter((course) => course.published !== false);
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
    vimeoPreviewDefault: undefined,
  };
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const stored = await readJson<SiteSettings>(SITE_SETTINGS_KEY, {});
  return { ...getDefaultSiteSettings(), ...stored };
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

  const settings = await getSiteSettings();
  const previewVimeo = settings.vimeoPreviewDefault?.trim() || DEFAULT_PREVIEW_VIMEO;
  const lesson = buildNewVideoLesson({ ...params.input, title }, previewVimeo);

  if (isBaseCourseSlug(params.courseSlug)) {
    const base = baseCourses.find((course) => course.slug === params.courseSlug);
    if (!base?.sections.some((section) => section.id === params.input.sectionId)) {
      return { ok: false, reason: "Section introuvable" };
    }

    const overrides = await getCourseOverrides();
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

  const settings = await getSiteSettings();
  const previewVimeo = settings.vimeoPreviewDefault?.trim() || DEFAULT_PREVIEW_VIMEO;
  const course = buildDefaultStoredCourse({ ...input, slug }, previewVimeo);
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
