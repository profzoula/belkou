import { Award, Bot, type LucideIcon } from "lucide-react";
import type { CourseResource } from "@/lib/course-resources";
import { EXAM_EBOOK_LESSON_ID } from "@/lib/exam-ebooks";
import { siteConfig } from "@/lib/site-config";

export type CourseLesson = {
  id: string;
  title: string;
  duration: string;
  type: "video" | "article" | "resource";
  preview?: boolean;
  /** Self-hosted video (Supabase `videos` table UUID). Max ~50 Mo. */
  videoId?: string;
  /** Vimeo URL for larger videos (e.g. https://vimeo.com/123456789). */
  vimeoUrl?: string;
  /** YouTube / YouTube Live URL for live replays. */
  youtubeUrl?: string;
  /** Markdown — titres ##, sections repliables ### Titre */
  content?: string;
};

export type CourseSection = {
  id: string;
  title: string;
  lessons: CourseLesson[];
};

export type Course = {
  slug: string;
  title: string;
  instructor: string;
  rating: number;
  ratingsCount: number;
  studentsCount: number;
  totalDuration: string;
  lastUpdated: string;
  language: string;
  captions: boolean;
  skillLevel: string;
  price: number;
  originalPrice: number;
  bestseller?: boolean;
  plan?: "premium" | "vip";
  description: string;
  whatYouLearn: string[];
  /** Catégories homepage / filtre catalogue (ids canoniques) */
  categories?: string[];
  /** false = masqué sur le site public */
  published?: boolean;
  /** ISO date — le cours devient visible automatiquement à cette date */
  scheduledPublishAt?: string;
  thumbnail: {
    gradient: string;
    icon: LucideIcon;
    label: string;
    imageUrl?: string;
  };
  sections: CourseSection[];
  /** Fichiers téléchargeables (PDF, Word, ebook…) pour les inscrits */
  resources?: CourseResource[];
};

export const DEFAULT_COURSE_LANGUAGE = "Creole";

export function getCourseDisplayLanguage(language?: string): string {
  const value = language?.trim();
  if (
    !value ||
    value === "Français" ||
    value === "Créole" ||
    value === "Kreyòl" ||
    value.toLowerCase() === "francais" ||
    value.toLowerCase() === "creole" ||
    value.toLowerCase() === "kreyol"
  ) {
    return DEFAULT_COURSE_LANGUAGE;
  }
  return value;
}

const COURSE_STUDENT_DISPLAY_BASE: Record<string, number> = {
  "apps-ia-cursor-claude": 1247,
  "comptia-a-plus-core-1": 312,
  "koman-byen-metrize-obs-studio": 831,
  "koman-enstale-e-aktive-microsoft-office-365": 417,
};

export function getCourseStudentDisplayBase(slug: string): number {
  const known = COURSE_STUDENT_DISPLAY_BASE[slug];
  if (known !== undefined) return known;

  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return siteConfig.stats.courseStudentsBase + (hash % 614);
}

export function getDisplayedCourseStudentsCount(
  course: Pick<Course, "studentsCount" | "slug">,
): number {
  const floor = getCourseStudentDisplayBase(course.slug);
  return Math.max(course.studentsCount, floor);
}

/** Slugs hardcodés — les autres cours se créent via l'admin. */
export const BASE_COURSE_SLUGS = ["apps-ia-cursor-claude", "comptia-a-plus-core-1"] as const;

export function isBaseCourseSlug(slug: string): boolean {
  return (BASE_COURSE_SLUGS as readonly string[]).includes(slug);
}

export const courses: Course[] = [
  {
    slug: "apps-ia-cursor-claude",
    title: "Apps IA avec Cursor & Claude Code",
    instructor: "BelKou, Mackenson Lundi",
    rating: 4.8,
    ratingsCount: 38,
    studentsCount: 1247,
    totalDuration: "8h total",
    lastUpdated: "juin 2026",
    language: DEFAULT_COURSE_LANGUAGE,
    captions: true,
    skillLevel: "Débutant",
    price: siteConfig.plans.premium.price,
    originalPrice: 399,
    bestseller: true,
    plan: "premium",
    description:
      "Apprenez à créer des applications web modernes avec Cursor, Claude Code et l'IA — sans être développeur. De l'idée au déploiement, étape par étape.",
    whatYouLearn: [
      "Utiliser Cursor et Claude Code pour générer du code",
      "Structurer une application React / TypeScript",
      "Intégrer l'IA dans vos produits",
      "Déployer votre première app en ligne",
    ],
    thumbnail: {
      gradient: "from-violet-600 via-indigo-600 to-blue-700",
      icon: Bot,
      label: "Claude Code",
    },
    sections: [
      {
        id: "intro",
        title: "Introduction",
        lessons: [
          {
            id: "intro-welcome",
            title: "Bienvenue dans le cours",
            duration: "4min",
            type: "video",
            preview: true,
          },
          {
            id: "intro-tools",
            title: "Outils : Cursor, Claude & Replit",
            duration: "12min",
            type: "video",
            preview: true,
          },
          {
            id: "intro-setup",
            title: "Configuration de l'environnement",
            duration: "8min",
            type: "video",
          },
          {
            id: "intro-first",
            title: "Votre premier prompt efficace",
            duration: "11min",
            type: "video",
          },
        ],
      },
      {
        id: "build",
        title: "Construire votre application",
        lessons: [
          {
            id: "build-ui",
            title: "Interface utilisateur avec l'IA",
            duration: "22min",
            type: "video",
          },
          {
            id: "build-logic",
            title: "Logique métier et formulaires",
            duration: "18min",
            type: "video",
          },
          { id: "build-api", title: "Connecter une API", duration: "25min", type: "video" },
          {
            id: "build-resources",
            title: "Ressources du module",
            duration: "5min",
            type: "resource",
          },
        ],
      },
      {
        id: "deploy",
        title: "Déploiement & lancement",
        lessons: [
          {
            id: "deploy-host",
            title: "Héberger sur Railway / Cloudflare",
            duration: "16min",
            type: "video",
          },
          { id: "deploy-domain", title: "Domaine et HTTPS", duration: "10min", type: "video" },
          {
            id: "deploy-launch",
            title: "Checklist de lancement",
            duration: "8 min",
            type: "article",
            content:
              "## Checklist de lancement\n\nAvant de mettre votre app en ligne, vérifiez chaque point ci-dessous.\n\n### Domaine & HTTPS\nConfigurez votre nom de domaine et activez HTTPS (Cloudflare ou hébergeur).\n\n### Variables d'environnement\nVérifiez que toutes les clés API sont définies en production — jamais dans le code source.\n\n### Paiement & emails\nTestez un achat réel ou en mode test, et confirmez la réception des emails transactionnels.",
          },
        ],
      },
    ],
  },
  {
    slug: "comptia-a-plus-core-1",
    title: "CompTIA A+ Core 1 (220-1101) — Banque de questions",
    instructor: "BelKou, Mackenson Lundi",
    rating: 4.9,
    ratingsCount: 12,
    studentsCount: 312,
    totalDuration: "700+ questions",
    lastUpdated: "août 2026",
    language: DEFAULT_COURSE_LANGUAGE,
    captions: false,
    skillLevel: "Intermédiaire",
    price: 25,
    originalPrice: 49,
    bestseller: false,
    plan: "premium",
    description:
      "Préparez l'examen CompTIA A+ Core 1 (220-1101) avec une banque de 700+ questions structurées, réponses et explications. Travaillez par domaine : matériel, réseaux, mobile, virtualisation et cas réels.",
    whatYouLearn: [
      "Réviser les domaines Core 1 (220-1101) avec des QCM ciblés",
      "Masquer / afficher les réponses pour s'entraîner comme à l'examen",
      "Comprendre chaque réponse grâce aux explications détaillées",
      "Chercher une notion et imprimer / exporter en PDF",
    ],
    categories: ["certification", "ebook"],
    published: true,
    thumbnail: {
      gradient: "from-slate-900 via-blue-900 to-red-900",
      icon: Award,
      label: "CompTIA A+ Core 1",
    },
    sections: [
      {
        id: "intro",
        title: "Introduction",
        lessons: [
          {
            id: "intro-welcome",
            title: "Comment utiliser cette banque",
            duration: "5min",
            type: "article",
            preview: true,
            content: `## Bienvenue

Cette banque de questions vous aide à préparer **CompTIA A+ Core 1 (220-1101)**.

### Contenu
- **700+ questions** à choix multiple
- Réponses et explications
- 7 parties : matériel, dépannage, réseaux, mobile, cloud, scénarios avancés, synthèse

### Comment étudier
1. Ouvrez la leçon **Banque de questions**
2. Travaillez une partie à la fois
3. Masquez les réponses, puis vérifiez l'explication
4. Utilisez la recherche pour réviser une notion précise

Après achat, l'accès est à vie depuis votre dashboard.`,
          },
        ],
      },
      {
        id: "exam-bank",
        title: "Entraînement",
        lessons: [
          {
            id: EXAM_EBOOK_LESSON_ID,
            title: "Banque de questions A+ Core 1",
            duration: "illimité",
            type: "article",
            content:
              "Ouvrez la banque interactive pour réviser les 700+ questions CompTIA A+ Core 1.",
          },
        ],
      },
    ],
  },
];

export function getCourseBySlug(slug: string): Course | undefined {
  return courses.find((course) => course.slug === slug);
}

export function getAllLessons(course: { sections: CourseSection[] }): CourseLesson[] {
  return course.sections.flatMap((section) => section.lessons);
}

export function getLessonVideoId(lesson: CourseLesson): string | null {
  const trimmed = lesson.videoId?.trim();
  return trimmed || null;
}

export function getLessonVimeoUrl(lesson: CourseLesson): string | null {
  const trimmed = lesson.vimeoUrl?.trim();
  return trimmed || null;
}

export function getLessonYoutubeUrl(lesson: CourseLesson): string | null {
  const trimmed = lesson.youtubeUrl?.trim();
  return trimmed || null;
}

export function lessonHasVideo(lesson: CourseLesson): boolean {
  return (
    lesson.type === "video" &&
    Boolean(getLessonVideoId(lesson) || getLessonVimeoUrl(lesson) || getLessonYoutubeUrl(lesson))
  );
}

export function isWelcomePreviewLesson(lesson: Pick<CourseLesson, "id" | "title">): boolean {
  if (lesson.id === "intro-welcome") return true;
  return lesson.title.toLowerCase().includes("bienvenue");
}

export function getWelcomePreviewLesson(course: {
  sections: CourseSection[];
}): CourseLesson | undefined {
  const previews = getPreviewVideoLessons(course);
  const welcomeCandidate =
    previews.find((lesson) => lesson.id === "intro-welcome") ??
    previews.find((lesson) => isWelcomePreviewLesson(lesson)) ??
    previews[0];

  if (welcomeCandidate) return welcomeCandidate;

  const videos = getAllLessons(course).filter((lesson) => lesson.type === "video");
  return (
    videos.find((lesson) => lesson.id === "intro-welcome") ??
    videos.find((lesson) => lesson.preview) ??
    videos.find((lesson) => isWelcomePreviewLesson(lesson))
  );
}

export function getWelcomeLearnSearch(course: {
  sections: CourseSection[];
}): { lesson: string } | undefined {
  const welcome = getWelcomePreviewLesson(course);
  return welcome ? { lesson: welcome.id } : undefined;
}

export function getPreviewLearnSearch(course: {
  sections: CourseSection[];
}): { lesson: string } | undefined {
  const preview = getFirstPreviewVideoLesson(course);
  return preview ? { lesson: preview.id } : undefined;
}

/** Prefer a preview with video; fall back to welcome lesson metadata. */
export function getPlayableLearnSearch(course: {
  sections: CourseSection[];
}): { lesson: string } | undefined {
  return getPreviewLearnSearch(course) ?? getWelcomeLearnSearch(course);
}

/** First incomplete lesson, or the first lesson when none are completed yet. */
export function getNextLessonToWatch(
  course: { sections: CourseSection[] },
  completedLessonIds: string[] = [],
): CourseLesson | undefined {
  const lessons = getAllLessons(course);
  if (!lessons.length) return undefined;

  const completed = new Set(completedLessonIds);
  return lessons.find((lesson) => !completed.has(lesson.id)) ?? lessons[0];
}

/** Prefer the last opened lesson; fall back to the first incomplete one. */
export function getResumeLesson(
  course: { sections: CourseSection[] },
  options: {
    completedLessonIds?: string[];
    lastLessonId?: string | null;
  } = {},
): CourseLesson | undefined {
  const lessons = getAllLessons(course);
  if (!lessons.length) return undefined;

  if (options.lastLessonId) {
    const last = lessons.find((lesson) => lesson.id === options.lastLessonId);
    if (last) return last;
  }

  return getNextLessonToWatch(course, options.completedLessonIds);
}

export function getContinueLearnSearch(
  course: { sections: CourseSection[] },
  completedLessonIds: string[] = [],
  lastLessonId?: string | null,
): { lesson: string } | undefined {
  const lesson = getResumeLesson(course, { completedLessonIds, lastLessonId });
  return lesson ? { lesson: lesson.id } : undefined;
}

export function lastLessonStorageKey(courseSlug: string): string {
  return `belkou:last-lesson:${courseSlug}`;
}

export function getCourseActionLabel(progressPercent: number): string {
  return progressPercent > 0 ? "Continuer le cours" : "Commencer le cours";
}

export function getLessonById(
  course: { sections: CourseSection[] },
  lessonId: string,
): CourseLesson | undefined {
  return getAllLessons(course).find((lesson) => lesson.id === lessonId);
}

export function getSectionForLesson(
  course: { sections: CourseSection[] },
  lessonId: string,
): CourseSection | undefined {
  return course.sections.find((section) =>
    section.lessons.some((lesson) => lesson.id === lessonId),
  );
}

export function countLessons(course: { sections: CourseSection[] }): number {
  return getAllLessons(course).length;
}

/** A lesson a student can actually finish (video uploaded/Vimeo, or article with text). */
export function lessonIsCompletable(lesson: CourseLesson): boolean {
  if (lesson.type === "video") return lessonHasVideo(lesson);
  return Boolean(lesson.content?.trim());
}

/**
 * Lesson ids that gate the sequential unlock. Empty placeholder lessons are excluded:
 * a student cannot finish them, so keeping them would lock the rest of the course.
 */
export function getSequenceLessonIds(course: { sections: CourseSection[] }): string[] {
  return getAllLessons(course)
    .filter(lessonIsCompletable)
    .map((lesson) => lesson.id);
}

/** Parse "4min", "8 min", "1h 30min", etc. into minutes. */
export function parseLessonDurationMinutes(duration: string): number {
  const normalized = duration.trim().toLowerCase();
  if (!normalized) return 0;

  let total = 0;
  const hoursMatch = normalized.match(/(\d+(?:[.,]\d+)?)\s*h(?:\b|[^a-z])/);
  if (hoursMatch) {
    total += parseFloat(hoursMatch[1].replace(",", ".")) * 60;
  }

  const minutesMatch = normalized.match(/(\d+(?:[.,]\d+)?)\s*min/);
  if (minutesMatch) {
    total += parseFloat(minutesMatch[1].replace(",", "."));
  }

  if (total > 0) return total;

  const bareNumber = normalized.match(/^(\d+(?:[.,]\d+)?)$/);
  if (bareNumber) return parseFloat(bareNumber[1].replace(",", "."));

  return 0;
}

export function getCourseDurationMinutes(course: { sections: CourseSection[] }): number {
  return getCourseVideoDurationMinutes(course);
}

export function getVideoLessons(course: { sections: CourseSection[] }): CourseLesson[] {
  return getAllLessons(course).filter((lesson) => lesson.type === "video");
}

/** Normalise free-form admin input ("28", "25 min") to the sidebar format ("28min"). */
export function formatLessonDurationLabel(duration: string): string {
  const trimmed = duration.trim();
  if (!trimmed) return "";

  const minutes = parseLessonDurationMinutes(trimmed);
  if (minutes <= 0) return trimmed;

  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  if (hours > 0 && rest > 0) return `${hours}h ${rest}min`;
  if (hours > 0) return `${hours}h`;
  return `${rest}min`;
}

export function getLessonDisplayDuration(lesson: CourseLesson): string | null {
  if (lesson.type === "video" && !lessonHasVideo(lesson)) return null;

  return formatLessonDurationLabel(lesson.duration ?? "") || null;
}

export function getSectionDurationMinutes(section: CourseSection): number {
  return section.lessons.reduce((sum, lesson) => {
    if (!getLessonDisplayDuration(lesson)) return sum;
    return sum + parseLessonDurationMinutes(lesson.duration ?? "");
  }, 0);
}

export function getCourseVideoDurationMinutes(course: { sections: CourseSection[] }): number {
  return getVideoLessons(course).reduce((sum, lesson) => {
    if (!lessonHasVideo(lesson)) return sum;
    return sum + parseLessonDurationMinutes(lesson.duration ?? "");
  }, 0);
}

export function formatCourseDurationLabel(totalMinutes: number): string {
  if (totalMinutes <= 0) return "—";

  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);

  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}min`;
  if (hours > 0) return `${hours}h total`;
  return `${minutes}min`;
}

/** Total shown in curriculum — sum of every lesson duration visible in the sidebar. */
export function getCourseContentDurationMinutes(course: { sections: CourseSection[] }): number {
  return course.sections.reduce((sum, section) => sum + getSectionDurationMinutes(section), 0);
}

export function getCourseDisplayDuration(course: { sections: CourseSection[] }): string {
  return formatCourseDurationLabel(getCourseContentDurationMinutes(course));
}

export function computeCourseProgressPercent(
  course: { sections: CourseSection[] },
  completedLessonIds: string[],
): number {
  const completableLessons = getAllLessons(course).filter(lessonIsCompletable);
  const completedSet = new Set(completedLessonIds);

  const totalMinutes = completableLessons.reduce(
    (sum, lesson) => sum + parseLessonDurationMinutes(lesson.duration ?? ""),
    0,
  );

  if (totalMinutes <= 0) {
    if (completableLessons.length === 0) return 0;
    const completedCount = completableLessons.filter((lesson) => completedSet.has(lesson.id)).length;
    return Math.min(100, Math.round((completedCount / completableLessons.length) * 100));
  }

  let completedMinutes = 0;
  for (const lesson of completableLessons) {
    if (!completedSet.has(lesson.id)) continue;
    completedMinutes += parseLessonDurationMinutes(lesson.duration ?? "");
  }

  return Math.min(100, Math.round((completedMinutes / totalMinutes) * 100));
}

export function formatCount(count: number): string {
  return new Intl.NumberFormat("fr-FR").format(count);
}

export function isFreeCourse(course: Pick<Course, "price">): boolean {
  return course.price <= 0;
}

export function formatCoursePrice(price: number): string {
  return isFreeCourse({ price }) ? "Gratuit" : `$${price}`;
}

export function isPreviewVideoAvailable(lesson: CourseLesson): boolean {
  return lesson.type === "video" && Boolean(lesson.preview) && lessonHasVideo(lesson);
}

export function getPreviewVideoLessons(course: { sections: CourseSection[] }): CourseLesson[] {
  return getAllLessons(course).filter((lesson) => isPreviewVideoAvailable(lesson));
}

export function getFirstPreviewVideoLesson(course: {
  sections: CourseSection[];
}): CourseLesson | undefined {
  return getPreviewVideoLessons(course)[0];
}
