/**
 * Embed or refresh Session 1 quiz in the Prepare Anviwònman lesson (Supabase overrides).
 *
 * Usage:
 *   node scripts/seed-lesson-quiz.mjs
 *   node scripts/seed-lesson-quiz.mjs --dry-run
 *
 * Requires VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .dev.vars
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const COURSE_SLUG = "apps-ia-cursor-claude";
const OVERRIDES_KEY = "course_overrides";
const SECTION_HINT = /prepare.*anviw|anviw.*devlop/i;
const LESSON_HINT = /prepare|anviw|fondasyon|fondation|devlopman/i;
const QUIZ_FILE = join(root, "content/quizzes/prepare-anviwonnman-session1.json");
const QUIZ_HEADING = "1.6 Quiz — Session 1: Prepare Anviwònman Devlopman an";

function loadDevVars() {
  const path = join(root, ".dev.vars");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

function encodeLessonQuizForStorage(quiz) {
  return Buffer.from(JSON.stringify({ ...quiz, passScore: quiz.questions.length }), "utf8").toString("base64");
}

function buildLessonQuizDataBlockHtml(quiz) {
  const encoded = encodeLessonQuizForStorage(quiz);
  const count = quiz.questions.length;
  return `<div contenteditable="false" class="lesson-quiz-data-block">${encoded}</div><p class="lesson-quiz-data-label"><strong>Quiz enregistré</strong> · ${count} question${count > 1 ? "s" : ""} · ${count}/${count} requis · cliquez « Questions » pour modifier</p>`;
}

function buildQuizSubSessionHtml(quiz) {
  return `\n<h3 data-lesson-subsession data-lesson-quiz>${QUIZ_HEADING}</h3>\n${buildLessonQuizDataBlockHtml(quiz)}\n<p>Reponn tout kesyon yo kòrèkteman (5/5) pou kontinye.</p>\n`;
}

function mergeQuizIntoContent(content, quiz) {
  const blockHtml = buildLessonQuizDataBlockHtml(quiz);
  const quizBlockRe = /<div\b[^>]*class="[^"]*lesson-quiz-data-block[^"]*"[^>]*>[\s\S]*?<\/div>(?:\s*<p\b[^>]*class="[^"]*lesson-quiz-data-label[^"]*"[^>]*>[\s\S]*?<\/p>)?/i;

  if (quizBlockRe.test(content)) {
    return {
      content: content.replace(quizBlockRe, blockHtml),
      action: "updated existing quiz block",
    };
  }

  if (/<h3\b[^>]*\bdata-lesson-quiz\b/i.test(content)) {
    const headingRe = /<h3\b[^>]*\bdata-lesson-quiz\b[^>]*>[\s\S]*?<\/h3>/i;
    const afterHeading = content.replace(headingRe, `<h3 data-lesson-subsession data-lesson-quiz>${QUIZ_HEADING}</h3>`);
    return {
      content: afterHeading.includes("lesson-quiz-data-block")
        ? afterHeading.replace(quizBlockRe, blockHtml)
        : afterHeading.replace(
            /<h3\b[^>]*\bdata-lesson-quiz\b[^>]*>[\s\S]*?<\/h3>/i,
            `<h3 data-lesson-subsession data-lesson-quiz>${QUIZ_HEADING}</h3>\n${blockHtml}\n<p>Reponn tout kesyon yo kòrèkteman (5/5) pou kontinye.</p>`,
          ),
      action: "inserted quiz block under existing quiz heading",
    };
  }

  return {
    content: `${content.trim()}\n${buildQuizSubSessionHtml(quiz)}`,
    action: "appended quiz sub-session",
  };
}

loadDevVars();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dryRun = process.argv.includes("--dry-run");

if (!url || !key) {
  console.error("VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required in .dev.vars");
  process.exit(1);
}

if (!existsSync(QUIZ_FILE)) {
  console.error(`Quiz file missing: ${QUIZ_FILE}`);
  process.exit(1);
}

const quiz = JSON.parse(readFileSync(QUIZ_FILE, "utf8"));
const sb = createClient(url, key);

const baseSections = [
  { id: "intro", title: "Introduction" },
  { id: "build", title: "Construire votre application" },
  { id: "deploy", title: "Déploiement & lancement" },
];

function sectionTitle(courseOverride, sectionId) {
  const added = (courseOverride.addedSections ?? []).find((section) => section.id === sectionId);
  if (added) return added.title;
  const base = baseSections.find((section) => section.id === sectionId);
  return base?.title ?? sectionId;
}

function patchAddedLesson(courseOverride, lessonId, patch) {
  const addedLessons = courseOverride.addedLessons ?? [];
  const index = addedLessons.findIndex((item) => item.lesson.id === lessonId);
  if (index === -1) return false;

  const next = [...addedLessons];
  next[index] = {
    ...next[index],
    lesson: { ...next[index].lesson, ...patch },
  };
  courseOverride.addedLessons = next;
  return true;
}

function getLessonContent(courseOverride, target) {
  if (target.kind === "addedLessons") {
    const item = (courseOverride.addedLessons ?? []).find((entry) => entry.lesson.id === target.lessonId);
    return item?.lesson?.content ?? "";
  }
  return courseOverride.lessons?.[target.lessonId]?.content ?? "";
}

function setLessonContent(courseOverride, target, content) {
  if (target.kind === "addedLessons") {
    patchAddedLesson(courseOverride, target.lessonId, { content });
    return;
  }
  courseOverride.lessons = {
    ...(courseOverride.lessons ?? {}),
    [target.lessonId]: {
      ...(courseOverride.lessons?.[target.lessonId] ?? {}),
      content,
    },
  };
}

async function main() {
  const { data, error } = await sb.from("site_content").select("value").eq("key", OVERRIDES_KEY).maybeSingle();
  if (error) {
    console.error("Failed to read site_content:", error.message);
    process.exit(1);
  }

  const overrides = data?.value ?? {};
  const courseOverride = overrides[COURSE_SLUG] ?? {};
  let target = null;

  for (const item of courseOverride.addedLessons ?? []) {
    const title = item.lesson?.title ?? "";
    const section = sectionTitle(courseOverride, item.sectionId);
    if (SECTION_HINT.test(section) && LESSON_HINT.test(title)) {
      target = {
        kind: "addedLessons",
        lessonId: item.lesson.id,
        lessonTitle: title,
        sectionTitle: section,
      };
      break;
    }
  }

  if (!target) {
    for (const [lessonId, lessonPatch] of Object.entries(courseOverride.lessons ?? {})) {
      const title = lessonPatch.title ?? lessonId;
      if (LESSON_HINT.test(title)) {
        target = {
          kind: "lessons",
          lessonId,
          lessonTitle: title,
          sectionTitle: "(override base lesson)",
        };
        break;
      }
    }
  }

  if (!target) {
    console.error(
      `Lesson not found. Looked for section matching ${SECTION_HINT} and lesson matching ${LESSON_HINT}.`,
    );
    process.exit(1);
  }

  const currentContent = getLessonContent(courseOverride, target);
  if (!currentContent?.trim()) {
    console.error("Lesson has no content yet. Seed the article first (seed-lesson-article.mjs).");
    process.exit(1);
  }

  const { content: nextContent, action } = mergeQuizIntoContent(currentContent, quiz);

  console.log(`Target: ${target.sectionTitle} → ${target.lessonTitle} (${target.lessonId})`);
  console.log(`Quiz: ${quiz.title} · ${quiz.questions.length} questions`);
  console.log(`Action: ${action}`);
  console.log(`Content size: ${currentContent.length} → ${nextContent.length} chars`);

  setLessonContent(courseOverride, target, nextContent);
  overrides[COURSE_SLUG] = courseOverride;

  if (dryRun) {
    console.log("\n--dry-run: no write.");
    return;
  }

  const { error: writeError } = await sb.from("site_content").upsert({
    key: OVERRIDES_KEY,
    value: overrides,
    updated_at: new Date().toISOString(),
  });

  if (writeError) {
    console.error("Failed to write site_content:", writeError.message);
    process.exit(1);
  }

  console.log("Done — quiz embedded. Refresh admin or course player to verify.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
