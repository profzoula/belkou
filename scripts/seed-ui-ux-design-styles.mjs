/**
 * Create/update "UI/UX Design Styles" article on Aprann VibeCoding.
 *
 * Usage:
 *   node scripts/seed-ui-ux-design-styles.mjs
 *   node scripts/seed-ui-ux-design-styles.mjs --dry-run
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const COURSE_SLUG = "apps-ia-cursor-claude";
const OVERRIDES_KEY = "course_overrides";
const LESSON_TITLE = "UI/UX Design Styles";
const LESSON_ID_PREFIX = "ui-ux-design-styles-";
const ARTICLE_FILE = join(root, "content/courses/apps-ia-cursor-claude/ui-ux-design-styles.html");

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

if (!existsSync(ARTICLE_FILE)) {
  console.error(`Content file missing: ${ARTICLE_FILE}`);
  process.exit(1);
}

const content = readFileSync(ARTICLE_FILE, "utf8").trim();
const sb = createClient(url, key);

async function main() {
  const { data, error } = await sb
    .from("site_content")
    .select("value")
    .eq("key", OVERRIDES_KEY)
    .maybeSingle();
  if (error) {
    console.error("Failed to read site_content:", error.message);
    process.exit(1);
  }

  const overrides = data?.value ?? {};
  const courseOverride = { ...(overrides[COURSE_SLUG] ?? {}) };
  const addedLessons = [...(courseOverride.addedLessons ?? [])];

  let existing = addedLessons.find(
    (entry) =>
      entry.lesson?.id?.startsWith(LESSON_ID_PREFIX) ||
      String(entry.lesson?.title ?? "").toLowerCase() === LESSON_TITLE.toLowerCase(),
  );

  const anchorLesson = addedLessons.find((entry) =>
    String(entry.lesson?.title ?? "")
      .toLowerCase()
      .includes("prompt vs skill"),
  );
  const sectionId = existing?.sectionId ?? anchorLesson?.sectionId ?? "build";

  if (!existing) {
    const lessonId = `${LESSON_ID_PREFIX}${Date.now().toString(36)}`;
    existing = {
      sectionId,
      lesson: {
        id: lessonId,
        title: LESSON_TITLE,
        duration: "25 min",
        type: "article",
        preview: false,
        content: "",
      },
    };
    const anchorIndex = addedLessons.findIndex(
      (entry) => entry.lesson?.id === anchorLesson?.lesson?.id,
    );
    if (anchorIndex >= 0) {
      addedLessons.splice(anchorIndex + 1, 0, existing);
    } else {
      addedLessons.push(existing);
    }
    console.log(`Creating lesson ${lessonId} in section ${sectionId}`);
  } else {
    console.log(`Updating lesson ${existing.lesson.id} in section ${existing.sectionId}`);
  }

  const index = addedLessons.findIndex((entry) => entry.lesson.id === existing.lesson.id);
  addedLessons[index] = {
    ...addedLessons[index],
    sectionId,
    lesson: {
      ...addedLessons[index].lesson,
      type: "article",
      title: LESSON_TITLE,
      duration: "25 min",
      content,
      videoId: "",
      vimeoUrl: "",
      preview: false,
    },
  };

  courseOverride.addedLessons = addedLessons;
  overrides[COURSE_SLUG] = courseOverride;

  console.log(`Content: ${content.length} chars, 19 style templates referenced`);

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

  console.log("Done — UI/UX Design Styles saved. Refresh the course player.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
