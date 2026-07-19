/**
 * Seed Prompt Engineering article HTML (without quiz — use seed-prompt-engineering-quiz.mjs for full sync).
 *
 * Usage:
 *   node scripts/seed-prompt-engineering-article.mjs
 *   node scripts/seed-prompt-engineering-article.mjs --dry-run
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const COURSE_SLUG = "apps-ia-cursor-claude";
const OVERRIDES_KEY = "course_overrides";
const LESSON_ID = "prompt-engeneering-mr6ul87b";
const CONTENT_FILE = join(root, "content/courses/apps-ia-cursor-claude/prompt-engineering.html");

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

loadDevVars();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dryRun = process.argv.includes("--dry-run");

if (!url || !key) {
  console.error("VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required in .dev.vars or .env");
  process.exit(1);
}

if (!existsSync(CONTENT_FILE)) {
  console.error(`Content file missing: ${CONTENT_FILE}`);
  process.exit(1);
}

const content = readFileSync(CONTENT_FILE, "utf8").trim();
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
  const { data, error } = await sb.from("site_content").select("value").eq("key", OVERRIDES_KEY).maybeSingle();
  if (error) {
    console.error("Failed to read site_content:", error.message);
    process.exit(1);
  }

  const overrides = data?.value ?? {};
  const courseOverride = overrides[COURSE_SLUG] ?? {};
  const item = (courseOverride.addedLessons ?? []).find((entry) => entry.lesson?.id === LESSON_ID);

  if (!item) {
    console.error(`Lesson ${LESSON_ID} not found in addedLessons. Create it in admin first.`);
    process.exit(1);
  }

  const patch = {
    type: "article",
    title: "Prompt Engineering",
    duration: "18 min",
    content,
    videoId: "",
    vimeoUrl: "",
  };

  console.log(`Target: ${item.sectionId} → ${item.lesson.title} (${LESSON_ID})`);
  console.log(`Content: ${content.length} chars, ${content.split("\n").length} lines`);
  console.log(`Patch: type=article, duration="${patch.duration}", title="${patch.title}"`);

  patchAddedLesson(courseOverride, LESSON_ID, patch);
  overrides[COURSE_SLUG] = courseOverride;

  if (dryRun) {
    console.log("\n--dry-run: no write. First 600 chars:\n");
    console.log(content.slice(0, 600));
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

  console.log("Done — Prompt Engineering article saved. Refresh course player to verify.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
