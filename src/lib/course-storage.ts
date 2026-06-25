import type { Course, CourseLesson, CourseSection } from "@/lib/courses";
import { getCourseIcon } from "@/lib/course-icons";
import { siteConfig } from "@/lib/site-config";

export type StoredCourseThumbnail = {
  gradient: string;
  label: string;
  iconKey?: string;
  imageUrl?: string;
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
      ...(stored.thumbnail.imageUrl ? { imageUrl: stored.thumbnail.imageUrl } : {}),
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

export type CourseMetaPatch = {
  title?: string;
  description?: string;
  instructor?: string;
  price?: number;
  originalPrice?: number;
  plan?: "premium" | "vip";
  skillLevel?: string;
  totalDuration?: string;
  bestseller?: boolean;
  whatYouLearn?: string[];
  thumbnailLabel?: string;
  thumbnailGradient?: string;
  thumbnailImageUrl?: string;
  published?: boolean;
  scheduledPublishAt?: string | null;
};

export function patchStoredCourseMeta(course: StoredCourse, patch: CourseMetaPatch): StoredCourse {
  return {
    ...course,
    ...(patch.title !== undefined && { title: patch.title }),
    ...(patch.description !== undefined && { description: patch.description }),
    ...(patch.instructor !== undefined && { instructor: patch.instructor }),
    ...(patch.price !== undefined && { price: patch.price }),
    ...(patch.originalPrice !== undefined && { originalPrice: patch.originalPrice }),
    ...(patch.plan !== undefined && { plan: patch.plan }),
    ...(patch.skillLevel !== undefined && { skillLevel: patch.skillLevel }),
    ...(patch.totalDuration !== undefined && { totalDuration: patch.totalDuration }),
    ...(patch.bestseller !== undefined && { bestseller: patch.bestseller }),
    ...(patch.whatYouLearn !== undefined && { whatYouLearn: patch.whatYouLearn }),
    ...(patch.published !== undefined && { published: patch.published }),
    ...(patch.scheduledPublishAt !== undefined && {
      scheduledPublishAt: patch.scheduledPublishAt ?? undefined,
    }),
    thumbnail: {
      ...course.thumbnail,
      ...(patch.thumbnailLabel !== undefined && { label: patch.thumbnailLabel }),
      ...(patch.thumbnailGradient !== undefined && { gradient: patch.thumbnailGradient }),
      ...(patch.thumbnailImageUrl !== undefined && {
        imageUrl: patch.thumbnailImageUrl.trim() || undefined,
      }),
    },
  };
}

export type AddLessonInput = {
  sectionId: string;
  title: string;
  duration?: string;
  vimeo?: string;
  preview?: boolean;
};

export function buildNewVideoLesson(input: AddLessonInput, previewVimeo?: string): CourseLesson {
  const id = `${slugifyTitle(input.title) || "lesson"}-${Date.now().toString(36)}`;
  return {
    id,
    title: input.title,
    duration: input.duration ?? "5min",
    type: "video",
    preview: input.preview ?? false,
    vimeo: input.vimeo || (input.preview ? previewVimeo : undefined),
  };
}

export function addLessonToStoredCourse(
  course: StoredCourse,
  sectionId: string,
  lesson: CourseLesson,
): StoredCourse | null {
  if (!course.sections.some((section) => section.id === sectionId)) {
    return null;
  }

  return {
    ...course,
    sections: course.sections.map((section) =>
      section.id === sectionId ? { ...section, lessons: [...section.lessons, lesson] } : section,
    ),
  };
}

export function buildNewSection(title: string): CourseSection {
  const id = `${slugifyTitle(title) || "section"}-${Date.now().toString(36)}`;
  return {
    id,
    title: title.trim(),
    lessons: [],
  };
}

export function addSectionToStoredCourse(course: StoredCourse, section: CourseSection): StoredCourse {
  return {
    ...course,
    sections: [...course.sections, section],
  };
}

export function deleteLessonFromStoredCourse(course: StoredCourse, lessonId: string): StoredCourse {
  return {
    ...course,
    sections: course.sections.map((section) => ({
      ...section,
      lessons: section.lessons.filter((lesson) => lesson.id !== lessonId),
    })),
  };
}

export function deleteSectionFromStoredCourse(
  course: StoredCourse,
  sectionId: string,
): StoredCourse | null {
  if (!course.sections.some((section) => section.id === sectionId)) return null;

  const nextSections = course.sections.filter((section) => section.id !== sectionId);
  if (nextSections.length === 0) {
    return {
      ...course,
      sections: [buildNewSection("Introduction")],
    };
  }

  return {
    ...course,
    sections: nextSections,
  };
}

export type CreateCourseInput = {
  title: string;
  slug: string;
  description?: string;
  plan?: "premium" | "vip";
  instructor?: string;
};

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
    published: false,
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
