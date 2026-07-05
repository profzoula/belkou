/**
 * Seed article content into a course lesson via site_content overrides.
 *
 * Usage:
 *   node scripts/seed-lesson-article.mjs
 *   node scripts/seed-lesson-article.mjs --dry-run
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
const SECTION_HINT = /prepare.*anviw/i;
const LESSON_HINT = /fondasyon|fondation/i;
const CONTENT_FILE = join(
  root,
  "content/courses/apps-ia-cursor-claude/prepare-anviwònman-fondation.md",
);

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

loadDevVars();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dryRun = process.argv.includes("--dry-run");

if (!url || !key) {
  console.error("VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required in .dev.vars");
  process.exit(1);
}

if (!existsSync(CONTENT_FILE)) {
  console.error(`Content file missing: ${CONTENT_FILE}`);
  process.exit(1);
}

const content = readFileSync(CONTENT_FILE, "utf8").trim();
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
    console.error("Add the lesson in admin first, or adjust SECTION_HINT / LESSON_HINT in this script.");
    process.exit(1);
  }

  const patch = {
    type: "article",
    duration: "12 min",
    content,
  };

  console.log(`Target: ${target.sectionTitle} → ${target.lessonTitle} (${target.lessonId})`);
  console.log(`Content: ${content.length} chars, ${content.split("\n").length} lines`);

  if (target.kind === "addedLessons") {
    patchAddedLesson(courseOverride, target.lessonId, patch);
  } else {
    courseOverride.lessons = {
      ...(courseOverride.lessons ?? {}),
      [target.lessonId]: {
        ...(courseOverride.lessons?.[target.lessonId] ?? {}),
        ...patch,
      },
    };
  }

  overrides[COURSE_SLUG] = courseOverride;

  if (dryRun) {
    console.log("\n--dry-run: no write. First 500 chars:\n");
    console.log(content.slice(0, 500));
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

  console.log("Done — article saved. Refresh admin or course player to verify.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
