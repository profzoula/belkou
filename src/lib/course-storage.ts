import type { Course, CourseLesson, CourseSection } from "@/lib/courses";
import { getCourseIcon } from "@/lib/course-icons";
import { siteConfig } from "@/lib/site-config";

export type StoredCourseThumbnail = {
  gradient: string;
  label: string;
  iconKey?: string;
};

export type StoredCourse = Omit<Course, "thumbnail"> & {
  thumbnail: StoredCourseThumbnail;
};

export function slugifyTitle(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function storedCourseToCourse(stored: StoredCourse): Course {
  const icon = getCourseIcon(stored.thumbnail.iconKey ?? stored.slug);
  return {
    ...stored,
    thumbnail: {
      gradient: stored.thumbnail.gradient,
      label: stored.thumbnail.label,
      icon,
    },
  };
}

export function patchLessonInStoredCourse(
  course: StoredCourse,
  lessonId: string,
  patch: Partial<Pick<CourseLesson, "vimeo" | "preview" | "title" | "duration">>,
): StoredCourse {
  return {
    ...course,
    sections: course.sections.map((section) => ({
      ...section,
      lessons: section.lessons.map((lesson) =>
        lesson.id === lessonId ? { ...lesson, ...patch } : lesson,
      ),
    })),
  };
}

export function courseToStored(course: Course): StoredCourse {
  return {
    ...course,
    thumbnail: {
      gradient: course.thumbnail.gradient,
      label: course.thumbnail.label,
      iconKey: course.slug,
    },
  };
}

export type CreateCourseInput = {
  title: string;
  slug: string;
  description?: string;
  plan?: "premium" | "vip";
  instructor?: string;
};

export function buildDefaultStoredCourse(input: CreateCourseInput, previewVimeo: string): StoredCourse {
  const plan = input.plan ?? "premium";
  const price = siteConfig.plans[plan].price;

  return {
    slug: input.slug,
    title: input.title,
    instructor: input.instructor ?? "BelKou, Prof Zoula",
    rating: 4.8,
    ratingsCount: 0,
    studentsCount: 0,
    totalDuration: "1h total",
    lastUpdated: new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
    language: "Français",
    captions: true,
    skillLevel: "Débutant",
    price,
    originalPrice: Math.round(price * 1.35),
    plan,
    description: input.description ?? "",
    whatYouLearn: [],
    thumbnail: {
      gradient: "from-violet-600 via-indigo-600 to-blue-700",
      label: input.title.length > 24 ? `${input.title.slice(0, 21)}…` : input.title,
    },
    sections: [
      {
        id: "intro",
        title: "Introduction",
        lessons: [
          {
            id: "intro-welcome",
            title: "Bienvenue dans le cours",
            duration: "5min",
            type: "video",
            preview: true,
            vimeo: previewVimeo,
          },
        ],
      } satisfies CourseSection,
    ],
  };
}
