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

const QUIZZES: Record<string, LessonQuiz> = {
  "prepare-anviwonnman-ch1": {
    id: "prepare-anviwonnman-ch1",
    title: "Quiz — Prepare Anviwònman Devlopman an",
    passScore: 5,
    questions: [
      {
        id: "q1",
        prompt: "Kisa yon Development Environment ye?",
        options: [
          { id: "a", label: "Yon navigatè entènèt sèlman" },
          { id: "b", label: "Tout ansanm zouti yon devlopè itilize pou kreye lojisyèl" },
          { id: "c", label: "Yon platfòm pou achte aplikasyon sou entènèt" },
          { id: "d", label: "Yon sistèm operasyon ki pa bezwen mizajou" },
        ],
        correctOptionId: "b",
        explanation:
          "Yon Development Environment gen ladan editè kòd, navigatè, AI, runtime, Git, Docker, elatriye.",
      },
      {
        id: "q2",
        prompt: "Ki minimòm RAM rekòmande pou travay konfòtabman ak VibeCoding?",
        options: [
          { id: "a", label: "4 Go" },
          { id: "b", label: "8 Go" },
          { id: "c", label: "16 Go" },
          { id: "d", label: "2 Go" },
        ],
        correctOptionId: "b",
        explanation: "Minimum se 8 Go RAM; 16 Go se ideyal pou Android Studio ak Docker ansanm.",
      },
      {
        id: "q3",
        prompt: "Poukisa Virtualization (Intel VT-x / AMD-V) enpòtan pou Android Emulator?",
        options: [
          { id: "a", label: "Li pèmèt w telechaje aplikasyon pi vit" },
          { id: "b", label: "San li, Emulator a ap mache trè dousman" },
          { id: "c", label: "Li obligatwa sèlman pou enstale Google Chrome" },
          { id: "d", label: "Li nesesè sèlman sou Linux" },
        ],
        correctOptionId: "b",
        explanation: "Android Emulator bezwen Virtualization aktive pou bon pèfòmans.",
      },
      {
        id: "q4",
        prompt: "Ki zouti Chrome ki evalye Performance, Accessibility, SEO ak PWA?",
        options: [
          { id: "a", label: "DevTools Console" },
          { id: "b", label: "Lighthouse" },
          { id: "c", label: "Responsive Mode" },
          { id: "d", label: "Network Tab" },
        ],
        correctOptionId: "b",
        explanation: "Lighthouse bay nòt ak rekòmandasyon sou pèfòmans, aksè, SEO ak PWA.",
      },
      {
        id: "q5",
        prompt: "Ki zouti sa a se yon Package Manager modèn ki pi rapid e ki itilize mwens espas pase npm?",
        options: [
          { id: "a", label: "Git" },
          { id: "b", label: "Postman" },
          { id: "c", label: "pnpm" },
          { id: "d", label: "Docker Desktop" },
        ],
        correctOptionId: "c",
        explanation: "pnpm se yon Package Manager modèn souvan itilize nan pwojè modèn.",
      },
    ],
  },
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

export function buildLessonQuizDataBlockHtml(quiz: LessonQuiz): string {
  const encoded = encodeLessonQuizData({ ...quiz, passScore: quiz.questions.length });
  const count = quiz.questions.length;
  return `<div contenteditable="false" data-lesson-quiz-data="${encoded}" class="lesson-quiz-data-block"><strong>Quiz</strong> · ${count} question${count > 1 ? "s" : ""} · ${count}/${count} requis · cliquez « Questions » pour modifier</div>`;
}

export function extractQuizFromSubSessionHtml(html: string): {
  quiz: LessonQuiz | null;
  introHtml: string;
} {
  const trimmed = html.trim();
  if (!trimmed) return { quiz: null, introHtml: "" };

  if (typeof document !== "undefined") {
    const doc = new DOMParser().parseFromString(trimmed, "text/html");
    const holder = doc.body.querySelector("[data-lesson-quiz-data]");
    if (!holder) return { quiz: null, introHtml: trimmed };
    const quiz = decodeLessonQuizData(holder.getAttribute("data-lesson-quiz-data") ?? "");
    holder.remove();
    return { quiz, introHtml: doc.body.innerHTML.trim() };
  }

  const match = trimmed.match(/<div\b[^>]*\bdata-lesson-quiz-data="([^"]+)"[^>]*>[\s\S]*?<\/div>/i);
  if (!match) return { quiz: null, introHtml: trimmed };
  const quiz = decodeLessonQuizData(match[1] ?? "");
  const introHtml = trimmed.replace(match[0], "").trim();
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
