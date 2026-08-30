/**
 * Paid exam ebooks — HTML lives under content/exams/ (not public).
 * Served only after paid/VIP access checks.
 */

export const EXAM_EBOOK_LESSON_ID = "banque-questions";

export type ExamEbookDefinition = {
  courseSlug: string;
  /** Relative to content/exams/ */
  relativePath: string;
  title: string;
};

export const EXAM_EBOOKS: ExamEbookDefinition[] = [
  {
    courseSlug: "comptia-a-plus-core-1",
    relativePath: "comptia-a-plus-core-1/index.html",
    title: "Banque de questions CompTIA A+ Core 1 (220-1101)",
  },
];

export function getExamEbookForCourse(courseSlug: string): ExamEbookDefinition | null {
  return EXAM_EBOOKS.find((item) => item.courseSlug === courseSlug) ?? null;
}

export function isExamEbookLesson(courseSlug: string, lessonId: string): boolean {
  return Boolean(getExamEbookForCourse(courseSlug) && lessonId === EXAM_EBOOK_LESSON_ID);
}
