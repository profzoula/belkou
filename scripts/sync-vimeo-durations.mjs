/**
 * Sync lesson durations from Vimeo for all video lessons stored in Supabase.
 *
 * Usage:
 *   node scripts/sync-vimeo-durations.mjs
 *   node scripts/sync-vimeo-durations.mjs --dry-run
 *   node scripts/sync-vimeo-durations.mjs --course apps-ia-cursor-claude
 *
 * Requires VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .dev.vars
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const OVERRIDES_KEY = "course_overrides";
const ADMIN_COURSES_KEY = "admin_courses";

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

function parseVimeoId(input) {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (/^\d+$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  return match?.[1] ?? null;
}

function formatDurationFromSeconds(seconds) {
  const totalMinutes = Math.max(1, Math.round(seconds / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}min`;
  if (hours > 0) return `${hours}h total`;
  return `${minutes}min`;
}

async function fetchVimeoDurationLabel(vimeoInput) {
  const id = parseVimeoId(vimeoInput);
  if (!id) return null;

  const pageUrl = `https://vimeo.com/${id}`;
  const endpoint = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(pageUrl)}`;
  const response = await fetch(endpoint, {
    headers: { Accept: "application/json", "User-Agent": "BelKou/1.0" },
  });
  if (!response.ok) return null;

  const data = await response.json();
  if (typeof data.duration !== "number" || data.duration <= 0) return null;
  return formatDurationFromSeconds(data.duration);
}

function parseLessonDurationMinutes(duration) {
  const normalized = duration.trim().toLowerCase();
  if (!normalized) return 0;

  let total = 0;
  const hoursMatch = normalized.match(/(\d+(?:[.,]\d+)?)\s*h(?:\b|[^a-z])/);
  if (hoursMatch) total += parseFloat(hoursMatch[1].replace(",", ".")) * 60;

  const minutesMatch = normalized.match(/(\d+(?:[.,]\d+)?)\s*min/);
  if (minutesMatch) total += parseFloat(minutesMatch[1].replace(",", "."));

  if (total > 0) return total;

  const bareNumber = normalized.match(/^(\d+(?:[.,]\d+)?)$/);
  if (bareNumber) return parseFloat(bareNumber[1].replace(",", "."));

  return 0;
}

function formatCourseDurationLabel(totalMinutes) {
  if (totalMinutes <= 0) return "—";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}min`;
  if (hours > 0) return `${hours}h total`;
  return `${minutes}min`;
}

function getLessonDisplayDuration(lesson) {
  if (lesson.type === "video") {
    if (!lesson.vimeo?.trim()) return null;
    return lesson.duration?.trim() || null;
  }
  return lesson.duration?.trim() || null;
}

function getSectionDurationMinutes(section) {
  return section.lessons.reduce((sum, lesson) => {
    if (!getLessonDisplayDuration(lesson)) return sum;
    return sum + parseLessonDurationMinutes(lesson.duration ?? "");
  }, 0);
}

function getCourseContentDurationMinutes(course) {
  return course.sections.reduce((sum, section) => sum + getSectionDurationMinutes(section), 0);
}

async function syncLessonDuration(lesson, label) {
  const vimeo = lesson.vimeo?.trim();
  if (!vimeo || lesson.type === "article" || lesson.type === "resource") return null;

  const resolved = await fetchVimeoDurationLabel(vimeo);
  if (!resolved) {
    console.warn(`  ⚠ ${label}: Vimeo duration not found (${vimeo})`);
    return null;
  }

  const before = lesson.duration?.trim() || "—";
  if (before === resolved) {
    console.log(`  ✓ ${label}: already ${resolved}`);
    return null;
  }

  console.log(`  → ${label}: ${before} → ${resolved}`);
  lesson.duration = resolved;
  return { before, after: resolved };
}

loadDevVars();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dryRun = process.argv.includes("--dry-run");
const courseFilter = process.argv.find((arg, index) => process.argv[index - 1] === "--course");

if (!url || !key) {
  console.error("VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required in .dev.vars");
  process.exit(1);
}

const sb = createClient(url, key);

async function main() {
  const [{ data: overridesRow, error: overridesError }, { data: adminRow, error: adminError }] =
    await Promise.all([
      sb.from("site_content").select("value").eq("key", OVERRIDES_KEY).maybeSingle(),
      sb.from("site_content").select("value").eq("key", ADMIN_COURSES_KEY).maybeSingle(),
    ]);

  if (overridesError) {
    console.error("Failed to read course_overrides:", overridesError.message);
    process.exit(1);
  }
  if (adminError) {
    console.error("Failed to read admin_courses:", adminError.message);
    process.exit(1);
  }

  const overrides = overridesRow?.value ?? {};
  const adminCourses = adminRow?.value ?? [];
  let updated = 0;

  for (const [courseSlug, courseOverride] of Object.entries(overrides)) {
    if (courseFilter && courseSlug !== courseFilter) continue;
    console.log(`\nCourse overrides: ${courseSlug}`);

    for (const [lessonId, lessonPatch] of Object.entries(courseOverride.lessons ?? {})) {
      const title = lessonPatch.title ?? lessonId;
      const result = await syncLessonDuration(lessonPatch, `${title} (${lessonId})`);
      if (result) updated += 1;
    }

    for (const item of courseOverride.addedLessons ?? []) {
      const title = item.lesson?.title ?? item.lesson?.id ?? "lesson";
      const result = await syncLessonDuration(item.lesson, `${title} (${item.lesson?.id})`);
      if (result) updated += 1;
    }

    const totalMinutes = getCourseContentDurationMinutes({
      sections: (courseOverride.addedSections ?? []).map((section) => ({
        ...section,
        lessons: [
          ...(section.lessons ?? []),
          ...(courseOverride.addedLessons ?? [])
            .filter((item) => item.sectionId === section.id)
            .map((item) => item.lesson),
        ],
      })),
    });

    if (totalMinutes > 0) {
      const nextTotal = formatCourseDurationLabel(totalMinutes);
      const currentTotal = courseOverride.meta?.totalDuration;
      if (currentTotal !== nextTotal) {
        console.log(`  → totalDuration: ${currentTotal ?? "—"} → ${nextTotal}`);
        courseOverride.meta = { ...(courseOverride.meta ?? {}), totalDuration: nextTotal };
        updated += 1;
      }
    }
  }

  for (const storedCourse of adminCourses) {
    if (courseFilter && storedCourse.slug !== courseFilter) continue;
    console.log(`\nAdmin course: ${storedCourse.slug}`);

    for (const section of storedCourse.sections ?? []) {
      for (const lesson of section.lessons ?? []) {
        const result = await syncLessonDuration(lesson, `${lesson.title} (${lesson.id})`);
        if (result) updated += 1;
      }
    }

    const totalMinutes = getCourseContentDurationMinutes(storedCourse);
    if (totalMinutes > 0) {
      const nextTotal = formatCourseDurationLabel(totalMinutes);
      if (storedCourse.totalDuration !== nextTotal) {
        console.log(`  → totalDuration: ${storedCourse.totalDuration ?? "—"} → ${nextTotal}`);
        storedCourse.totalDuration = nextTotal;
        updated += 1;
      }
    }
  }

  console.log(`\n${updated} change(s) detected.`);

  if (updated === 0) {
    console.log("Nothing to write.");
    return;
  }

  if (dryRun) {
    console.log("--dry-run: no write.");
    return;
  }

  const writes = [];
  if (Object.keys(overrides).length > 0) {
    writes.push(
      sb.from("site_content").upsert({
        key: OVERRIDES_KEY,
        value: overrides,
        updated_at: new Date().toISOString(),
      }),
    );
  }
  if (adminCourses.length > 0) {
    writes.push(
      sb.from("site_content").upsert({
        key: ADMIN_COURSES_KEY,
        value: adminCourses,
        updated_at: new Date().toISOString(),
      }),
    );
  }

  const results = await Promise.all(writes);
  for (const result of results) {
    if (result.error) {
      console.error("Failed to write site_content:", result.error.message);
      process.exit(1);
    }
  }

  console.log("Done — durations synced from Vimeo.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
