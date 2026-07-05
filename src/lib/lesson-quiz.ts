import type { ArticleSession } from "@/lib/lesson-sessions";

export type LessonQuizOption = {
  id: string;
  label: string;
};

export type LessonQuizQuestion = {
  id: string;
  prompt: string;
  options: LessonQuizOption[];
  correctOptionId: string;
  explanation?: string;
};

export type LessonQuiz = {
  id: string;
  title: string;
  passScore: number;
  questions: LessonQuizQuestion[];
};

const OPTION_IDS = ["a", "b", "c", "d"] as const;

export const PREPARE_ANVIWONMAN_SESSION1_QUIZ: LessonQuiz = {
  id: "prepare-anviwonnman-ch1",
  title: "Quiz — Session 1: Prepare Anviwònman Devlopman an",
  passScore: 5,
  questions: [
    {
      id: "q1",
      prompt: 'Ki objektif prensipal "Development Environment" la?',
      options: [
        { id: "a", label: "Pou fè òdinatè a pi bèl" },
        { id: "b", label: "Pou pèmèt devlopè a kreye aplikasyon avèk tout zouti ki nesesè yo" },
        { id: "c", label: "Pou jwe jwèt videyo sèlman" },
        { id: "d", label: "Pou telechaje mizik" },
      ],
      correctOptionId: "b",
      explanation: "Yon Development Environment se tout zouti devlopè a bezwen pou kreye aplikasyon.",
    },
    {
      id: "q2",
      prompt: "Ki kondisyon minimòm RAM atik la rekòmande pou VibeCoding?",
      options: [
        { id: "a", label: "4 GB" },
        { id: "b", label: "6 GB" },
        { id: "c", label: "8 GB" },
        { id: "d", label: "16 GB" },
      ],
      correctOptionId: "c",
      explanation: "Minimum se 8 GB RAM pou travay konfòtabman ak VibeCoding.",
    },
    {
      id: "q3",
      prompt: "Ki zouti Chrome DevTools ou itilize pou wè erè JavaScript epi teste kòd?",
      options: [
        { id: "a", label: "Elements" },
        { id: "b", label: "Console" },
        { id: "c", label: "Network" },
        { id: "d", label: "Performance" },
      ],
      correctOptionId: "b",
      explanation: "Tab Console pèmèt ou wè erè JavaScript epi teste kòd an tan reyèl.",
    },
    {
      id: "q4",
      prompt: "Ki zouti Chrome ki analize pèfòmans, SEO, Accessibility ak Best Practices yon sit entènèt?",
      options: [
        { id: "a", label: "DevTools" },
        { id: "b", label: "Postman" },
        { id: "c", label: "Lighthouse" },
        { id: "d", label: "Docker Desktop" },
      ],
      correctOptionId: "c",
      explanation: "Lighthouse evalye pèfòmans, SEO, aksè, Best Practices ak PWA.",
    },
    {
      id: "q5",
      prompt: "Ki zouti ki pèmèt ou estoke, pataje epi kolabore sou pwojè devlopman yo?",
      options: [
        { id: "a", label: "Android Studio" },
        { id: "b", label: "GitHub" },
        { id: "c", label: "Node.js" },
        { id: "d", label: "Bun" },
      ],
      correctOptionId: "b",
      explanation: "GitHub se platfòm pou estoke, pataje epi kolabore sou pwojè devlopman.",
    },
  ],
};

const QUIZZES: Record<string, LessonQuiz> = {
  "prepare-anviwonnman-ch1": PREPARE_ANVIWONMAN_SESSION1_QUIZ,
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function createQuestion(index: number): LessonQuizQuestion {
  return {
    id: `q${index}`,
    prompt: "",
    options: OPTION_IDS.map((id) => ({ id, label: "" })),
    correctOptionId: "a",
    explanation: "",
  };
}

export function createEmptyLessonQuiz(questionCount = 5): LessonQuiz {
  const questions = Array.from({ length: questionCount }, (_, index) => createQuestion(index + 1));
  return {
    id: `quiz-${Date.now()}`,
    title: "Quiz",
    passScore: questionCount,
    questions,
  };
}

export function normalizeLessonQuiz(input: Partial<LessonQuiz>): LessonQuiz | null {
  if (!input.questions?.length) return null;

  const questions = input.questions
    .map((question, index) => {
      const options = (question.options ?? []).slice(0, 4).map((option, optionIndex) => ({
        id: OPTION_IDS[optionIndex] ?? `o${optionIndex}`,
        label: String(option.label ?? "").trim(),
      }));
      while (options.length < 4) {
        options.push({ id: OPTION_IDS[options.length] ?? `o${options.length}`, label: "" });
      }
      const correctOptionId = options.some((option) => option.id === question.correctOptionId)
        ? question.correctOptionId!
        : options[0]!.id;

      return {
        id: question.id?.trim() || `q${index + 1}`,
        prompt: String(question.prompt ?? "").trim(),
        options,
        correctOptionId,
        explanation: String(question.explanation ?? "").trim() || undefined,
      };
    })
    .filter((question) => question.prompt);

  if (!questions.length) return null;

  return {
    id: input.id?.trim() || `quiz-${Date.now()}`,
    title: input.title?.trim() || "Quiz",
    passScore: questions.length,
    questions,
  };
}

export function encodeLessonQuizData(quiz: LessonQuiz): string {
  const json = JSON.stringify(quiz);
  if (typeof btoa !== "undefined") {
    return btoa(unescape(encodeURIComponent(json)));
  }
  return Buffer.from(json, "utf8").toString("base64");
}

export function decodeLessonQuizData(encoded: string): LessonQuiz | null {
  try {
    const trimmed = encoded.trim();
    if (!trimmed) return null;
    let json: string;
    if (typeof atob !== "undefined") {
      json = decodeURIComponent(escape(atob(trimmed)));
    } else {
      json = Buffer.from(trimmed, "base64").toString("utf8");
    }
    return normalizeLessonQuiz(JSON.parse(json) as Partial<LessonQuiz>);
  } catch {
    return null;
  }
}

export function encodeLessonQuizForStorage(quiz: LessonQuiz): string {
  return encodeLessonQuizData({ ...quiz, passScore: quiz.questions.length });
}

export function buildLessonQuizDataBlockHtml(quiz: LessonQuiz): string {
  const encoded = encodeLessonQuizForStorage(quiz);
  const count = quiz.questions.length;
  return `<div contenteditable="false" class="lesson-quiz-data-block">${encoded}</div><p class="lesson-quiz-data-label"><strong>Quiz enregistré</strong> · ${count} question${count > 1 ? "s" : ""} · ${count}/${count} requis · cliquez « Questions » pour modifier</p>`;
}

function decodeQuizHolderContent(raw: string | null | undefined): LessonQuiz | null {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) return null;
  return decodeLessonQuizData(trimmed);
}

function stripQuizLabelHtml(html: string): string {
  return html
    .replace(/<p\b[^>]*class="[^"]*lesson-quiz-data-label[^"]*"[^>]*>[\s\S]*?<\/p>/gi, "")
    .trim();
}

export function extractQuizFromSubSessionHtml(html: string): {
  quiz: LessonQuiz | null;
  introHtml: string;
} {
  const trimmed = html.trim();
  if (!trimmed) return { quiz: null, introHtml: "" };

  if (typeof document !== "undefined") {
    const doc = new DOMParser().parseFromString(trimmed, "text/html");
    const holder = doc.body.querySelector(".lesson-quiz-data-block, [data-lesson-quiz-data]");
    if (!holder) return { quiz: null, introHtml: trimmed };
    const quiz =
      decodeQuizHolderContent(holder.getAttribute("data-lesson-quiz-data")) ??
      decodeQuizHolderContent(holder.textContent);
    holder.remove();
    doc.body.querySelectorAll(".lesson-quiz-data-label").forEach((node) => node.remove());
    return { quiz, introHtml: doc.body.innerHTML.trim() };
  }

  const divMatch = trimmed.match(/<div\b[^>]*class="[^"]*lesson-quiz-data-block[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  if (divMatch) {
    const quiz = decodeQuizHolderContent(divMatch[1]);
    const introHtml = stripQuizLabelHtml(trimmed.replace(divMatch[0], ""));
    return { quiz, introHtml };
  }

  const attrMatch = trimmed.match(/<div\b[^>]*\bdata-lesson-quiz-data="([^"]+)"[^>]*>[\s\S]*?<\/div>/i);
  if (!attrMatch) return { quiz: null, introHtml: trimmed };
  const quiz = decodeQuizHolderContent(attrMatch[1]);
  const introHtml = stripQuizLabelHtml(trimmed.replace(attrMatch[0], ""));
  return { quiz, introHtml };
}

export function validateLessonQuizDraft(quiz: LessonQuiz): string | null {
  if (!quiz.questions.length) return "Ajoutez au moins une question.";

  for (let index = 0; index < quiz.questions.length; index += 1) {
    const question = quiz.questions[index]!;
    if (!question.prompt.trim()) {
      return `Question ${index + 1} : saisissez l'énoncé.`;
    }
    for (const option of question.options) {
      if (!option.label.trim()) {
        return `Question ${index + 1} : remplissez toutes les réponses (A, B, C, D).`;
      }
    }
  }

  return null;
}

export function getLessonQuiz(quizId: string): LessonQuiz | null {
  return QUIZZES[quizId] ?? null;
}

export function resolveLessonQuiz(sub: { quizId?: string; quiz?: LessonQuiz }): LessonQuiz | null {
  if (sub.quiz?.questions.length) return sub.quiz;
  if (sub.quizId) return getLessonQuiz(sub.quizId);
  return null;
}

export function findLessonQuizInLesson(
  lessonId: string,
  sessions: ArticleSession[],
): { subSessionId: string; quiz: LessonQuiz } | null {
  for (const session of sessions) {
    for (const sub of session.subSessions) {
      const quiz = resolveLessonQuiz(sub);
      if (quiz) {
        return {
          subSessionId: `${lessonId}::${session.number}::${sub.number}`,
          quiz,
        };
      }
    }
  }
  return null;
}

export function lessonQuizPassStorageKey(lessonId: string): string {
  return `${lessonId}::lesson-quiz-pass`;
}

export function quizStorageKey(storageKey: string): string {
  return `belkou:quiz-pass:${storageKey}`;
}

export function readQuizPass(storageKey: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(quizStorageKey(storageKey)) === "1";
  } catch {
    return false;
  }
}

export function writeQuizPass(storageKey: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(quizStorageKey(storageKey), "1");
  } catch {
    /* ignore quota / private mode */
  }
}

export function gradeLessonQuiz(
  quiz: LessonQuiz,
  answers: Record<string, string>,
): { score: number; total: number; passed: boolean } {
  let score = 0;
  for (const question of quiz.questions) {
    if (answers[question.id] === question.correctOptionId) score += 1;
  }
  const passScore = quiz.passScore || quiz.questions.length;
  return {
    score,
    total: quiz.questions.length,
    passed: score >= passScore,
  };
}

export function formatLessonQuizEditorSummary(quiz: LessonQuiz): string {
  const count = quiz.questions.length;
  return `Quiz · ${count} question${count > 1 ? "s" : ""} · ${count}/${count} requis`;
}

export { escapeHtml as escapeLessonQuizHtml };
