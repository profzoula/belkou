import type { Course, CourseLesson } from "@/lib/courses";
import { courses as baseCourses, DEFAULT_PREVIEW_VIMEO, isBaseCourseSlug } from "@/lib/courses";
import {
  buildDefaultStoredCourse,
  patchLessonInStoredCourse,
  storedCourseToCourse,
  type CreateCourseInput,
  type StoredCourse,
} from "@/lib/course-storage";
import { siteConfig } from "@/lib/site-config";
import { getSupabaseAdmin } from "@/server/supabase-registrations";

export type CourseLessonOverride = Partial<Pick<CourseLesson, "vimeo" | "preview" | "title" | "duration">>;

export type CourseOverride = {
  lessons?: Record<string, CourseLessonOverride>;
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
  if (!override?.lessons) return base;

  return {
    ...base,
    sections: base.sections.map((section) => ({
      ...section,
      lessons: section.lessons.map((lesson) => ({
        ...lesson,
        ...override.lessons?.[lesson.id],
      })),
    })),
  };
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
