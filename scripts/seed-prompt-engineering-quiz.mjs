/**
 * Seed Prompt Engineering article as visual-editor HTML + embedded quiz (Supabase).
 *
 * Usage:
 *   node scripts/seed-prompt-engineering-quiz.mjs
 *   node scripts/seed-prompt-engineering-quiz.mjs --dry-run
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const COURSE_SLUG = "apps-ia-cursor-claude";
const OVERRIDES_KEY = "course_overrides";
const LESSON_ID = "prompt-engeneering-mr6ul87b";
const ARTICLE_FILE = join(root, "content/courses/apps-ia-cursor-claude/prompt-engineering.html");
const QUIZ_FILE = join(root, "content/quizzes/prompt-engineering-session1.json");
const QUIZ_HEADING = "1.9 Quiz — Session 1: Prompt Engineering";

function loadDevVars() {
  for (const file of [".dev.vars", ".env"]) {
    const path = join(root, file);
    if (!existsSync(path)) continue;
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
  console.error("VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required in .dev.vars or .env");
  process.exit(1);
}

if (!existsSync(ARTICLE_FILE) || !existsSync(QUIZ_FILE)) {
  console.error("Missing article HTML or quiz JSON file.");
  process.exit(1);
}

const articleHtml = readFileSync(ARTICLE_FILE, "utf8").trim();
const quiz = JSON.parse(readFileSync(QUIZ_FILE, "utf8"));
const sb = createClient(url, key);

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

async function main() {
  const { content: nextContent, action } = mergeQuizIntoContent(articleHtml, quiz);

  const { data, error } = await sb.from("site_content").select("value").eq("key", OVERRIDES_KEY).maybeSingle();
  if (error) {
    console.error("Failed to read site_content:", error.message);
    process.exit(1);
  }

  const overrides = data?.value ?? {};
  const courseOverride = overrides[COURSE_SLUG] ?? {};
  const item = (courseOverride.addedLessons ?? []).find((entry) => entry.lesson?.id === LESSON_ID);

  if (!item) {
    console.error(`Lesson ${LESSON_ID} not found.`);
    process.exit(1);
  }

  const patch = {
    type: "article",
    title: "Prompt Engineering",
    duration: "20 min",
    content: nextContent,
    videoId: "",
    vimeoUrl: "",
  };

  console.log(`Target: ${item.sectionId} → Prompt Engineering (${LESSON_ID})`);
  console.log(`Format: visual HTML (RichTextEditor)`);
  console.log(`Quiz: ${quiz.title} · ${quiz.questions.length} questions (5/5 requis)`);
  console.log(`Action: ${action}`);
  console.log(`Content size: ${articleHtml.length} → ${nextContent.length} chars`);

  patchAddedLesson(courseOverride, LESSON_ID, patch);
  overrides[COURSE_SLUG] = courseOverride;

  if (dryRun) {
    console.log("\n--dry-run: no write. First 400 chars:\n");
    console.log(nextContent.slice(0, 400));
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

  console.log("Done — visual article + quiz saved. Refresh admin editor to verify.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
