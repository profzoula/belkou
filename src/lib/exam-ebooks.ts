/**
 * Paid exam practice banks — JSON under content/exams/ (not public).
 */

export const EXAM_EBOOK_LESSON_ID = "banque-questions";

export type ExamChoice = {
  letter: string;
  text: string;
};

export type ExamQuestion = {
  id: string;
  num: string;
  stem: string;
  choices: ExamChoice[];
  answer: string;
  explanation: string;
  sectionId: string;
  sectionTitle: string;
};

export type ExamBankPayload = {
  slug: string;
  examCode: string;
  title: string;
  subtitle: string;
  questionCount: number;
  sections: Array<{ id: string; title: string; subtitle: string }>;
  questions: ExamQuestion[];
};

export type ExamEbookDefinition = {
  courseSlug: string;
  /** Relative to content/exams/ — questions JSON for interactive quiz */
  questionsPath: string;
  title: string;
};

export const EXAM_EBOOKS: ExamEbookDefinition[] = [
  {
    courseSlug: "comptia-a-plus-core-1",
    questionsPath: "comptia-a-plus-core-1/questions.json",
    title: "Banque de questions CompTIA A+ Core 1 (220-1101)",
  },
];

export function getExamEbookForCourse(courseSlug: string): ExamEbookDefinition | null {
  return EXAM_EBOOKS.find((item) => item.courseSlug === courseSlug) ?? null;
}

export function isExamEbookLesson(courseSlug: string, lessonId: string): boolean {
  return Boolean(getExamEbookForCourse(courseSlug) && lessonId === EXAM_EBOOK_LESSON_ID);
}
