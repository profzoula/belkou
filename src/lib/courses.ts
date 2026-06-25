import { Bot, type LucideIcon } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { parseVimeoRef, type VimeoRef } from "@/lib/vimeo";

/** Preview intro — https://vimeo.com/1204014571 */
export const DEFAULT_PREVIEW_VIMEO = "1204014571";

export type CourseLesson = {
  id: string;
  title: string;
  duration: string;
  type: "video" | "article" | "resource";
  preview?: boolean;
  /** Vimeo ID or full URL (https://vimeo.com/123456789 or private link with hash). */
  vimeo?: string;
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
  /** false = masqué sur le site public */
  published?: boolean;
  thumbnail: {
    gradient: string;
    icon: LucideIcon;
    label: string;
  };
  sections: CourseSection[];
};

/** Slugs hardcodés — les autres cours se créent via l'admin. */
export const BASE_COURSE_SLUGS = ["apps-ia-cursor-claude"] as const;

export function isBaseCourseSlug(slug: string): boolean {
  return (BASE_COURSE_SLUGS as readonly string[]).includes(slug);
}

export const courses: Course[] = [
  {
    slug: "apps-ia-cursor-claude",
    title: "Apps IA avec Cursor & Claude Code",
    instructor: "BelKou, Prof Zoula",
    rating: 4.9,
    ratingsCount: 2684,
    studentsCount: siteConfig.stats.studentsBase,
    totalDuration: "8h total",
    lastUpdated: "juin 2026",
    language: "Français",
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
          { id: "intro-welcome", title: "Bienvenue dans le cours", duration: "4min", type: "video", preview: true, vimeo: DEFAULT_PREVIEW_VIMEO },
          { id: "intro-tools", title: "Outils : Cursor, Claude & Replit", duration: "12min", type: "video", preview: true, vimeo: DEFAULT_PREVIEW_VIMEO },
          { id: "intro-setup", title: "Configuration de l'environnement", duration: "8min", type: "video" },
          { id: "intro-first", title: "Votre premier prompt efficace", duration: "11min", type: "video" },
        ],
      },
      {
        id: "build",
        title: "Construire votre application",
        lessons: [
          { id: "build-ui", title: "Interface utilisateur avec l'IA", duration: "22min", type: "video" },
          { id: "build-logic", title: "Logique métier et formulaires", duration: "18min", type: "video" },
          { id: "build-api", title: "Connecter une API", duration: "25min", type: "video" },
          { id: "build-resources", title: "Ressources du module", duration: "5min", type: "resource" },
        ],
      },
      {
        id: "deploy",
        title: "Déploiement & lancement",
        lessons: [
          { id: "deploy-host", title: "Héberger sur Railway / Cloudflare", duration: "16min", type: "video" },
          { id: "deploy-domain", title: "Domaine et HTTPS", duration: "10min", type: "video" },
          { id: "deploy-launch", title: "Checklist de lancement", duration: "8min", type: "article" },
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

export function getLessonById(course: { sections: CourseSection[] }, lessonId: string): CourseLesson | undefined {
  return getAllLessons(course).find((lesson) => lesson.id === lessonId);
}

export function getSectionForLesson(course: { sections: CourseSection[] }, lessonId: string): CourseSection | undefined {
  return course.sections.find((section) => section.lessons.some((lesson) => lesson.id === lessonId));
}

export function countLessons(course: { sections: CourseSection[] }): number {
  return getAllLessons(course).length;
}

export function formatCount(count: number): string {
  return new Intl.NumberFormat("fr-FR").format(count);
}

const previewVimeoFallback =
  typeof import.meta !== "undefined" ? import.meta.env.VITE_VIMEO_PREVIEW_ID?.trim() : undefined;

export function getLessonVimeo(lesson: CourseLesson): VimeoRef | null {
  if (lesson.vimeo) {
    return parseVimeoRef(lesson.vimeo);
  }

  if (lesson.preview && previewVimeoFallback) {
    return parseVimeoRef(previewVimeoFallback);
  }

  return null;
}
