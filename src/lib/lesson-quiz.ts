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

export function getLessonQuiz(quizId: string): LessonQuiz | null {
  return QUIZZES[quizId] ?? null;
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
  return {
    score,
    total: quiz.questions.length,
    passed: score >= quiz.passScore,
  };
}
