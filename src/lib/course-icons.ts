import { Bot, CreditCard, Rocket, Workflow, type LucideIcon } from "lucide-react";
import type { PublicCourse } from "@/lib/fns/courses";
import type { Course } from "@/lib/courses";

const iconsByKey: Record<string, LucideIcon> = {
  bot: Bot,
  workflow: Workflow,
  rocket: Rocket,
  creditcard: CreditCard,
  "apps-ia-cursor-claude": Bot,
};

export function withCourseIcon(course: PublicCourse): Course {
  const icon = getCourseIcon(course.slug);
  return {
    ...course,
    thumbnail: {
      ...course.thumbnail,
      icon,
    },
  };
}

export function getCourseIcon(key: string): LucideIcon {
  const normalized = key.trim().toLowerCase();
  return iconsByKey[normalized] ?? Bot;
}
