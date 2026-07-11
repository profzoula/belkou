/**
 * Remove legacy Vimeo fields from Supabase site_content (course_overrides, admin_courses, site_settings).
 * Does not auto-map Vimeo IDs to videoId — re-link lessons in Admin → Cours after uploading videos.
 *
 * Usage:
 *   node scripts/migrate-vimeo-to-videoid.mjs
 *   node scripts/migrate-vimeo-to-videoid.mjs --dry-run
 *
 * Requires VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .dev.vars
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

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

const sb = createClient(url, key);

function stripVimeoFromLesson(lesson) {
  if (!lesson || typeof lesson !== "object") return { lesson, changed: false };
  if (!("vimeo" in lesson)) return { lesson, changed: false };
  const { vimeo: _removed, ...rest } = lesson;
  return { lesson: rest, changed: true };
}

function migrateCourseOverrides(overrides) {
  let changed = 0;
  const next = { ...overrides };

  for (const [slug, courseOverride] of Object.entries(next)) {
    if (!courseOverride || typeof courseOverride !== "object") continue;
    let courseChanged = false;
    const patched = { ...courseOverride };

    if (patched.lessons) {
      const lessons = { ...patched.lessons };
      for (const [lessonId, lessonPatch] of Object.entries(lessons)) {
        const { lesson, changed: lessonChanged } = stripVimeoFromLesson(lessonPatch);
        if (lessonChanged) {
          lessons[lessonId] = lesson;
          courseChanged = true;
          changed += 1;
        }
      }
      patched.lessons = lessons;
    }

    if (patched.addedLessons?.length) {
      patched.addedLessons = patched.addedLessons.map((item) => {
        const { lesson, changed: lessonChanged } = stripVimeoFromLesson(item.lesson);
        if (lessonChanged) courseChanged = true;
        return lessonChanged ? { ...item, lesson } : item;
      });
    }

    if (courseChanged) {
      next[slug] = patched;
    }
  }

  return { value: next, changed };
}

function migrateAdminCourses(courses) {
  if (!Array.isArray(courses)) return { value: courses, changed: 0 };

  let changed = 0;
  const next = courses.map((course) => {
    if (!course?.sections) return course;
    let courseChanged = false;
    const sections = course.sections.map((section) => {
      const lessons = section.lessons?.map((lesson) => {
        const { lesson: cleaned, changed: lessonChanged } = stripVimeoFromLesson(lesson);
        if (lessonChanged) {
          courseChanged = true;
          changed += 1;
        }
        return cleaned;
      });
      return courseChanged ? { ...section, lessons } : section;
    });
    return courseChanged ? { ...course, sections } : course;
  });

  return { value: next, changed };
}

function migrateSiteSettings(settings) {
  if (!settings || typeof settings !== "object") return { value: settings, changed: false };
  if (!("vimeoPreviewDefault" in settings)) return { value: settings, changed: false };
  const { vimeoPreviewDefault: _removed, ...rest } = settings;
  return { value: rest, changed: true };
}

async function readSiteContent(key, fallback) {
  const { data, error } = await sb.from("site_content").select("value").eq("key", key).maybeSingle();
  if (error) throw new Error(`${key}: ${error.message}`);
  return data?.value ?? fallback;
}

async function writeSiteContent(key, value) {
  const { error } = await sb.from("site_content").upsert(
    { key, value, updated_at: new Date().toISOString() },
    { onConflict: "key" },
  );
  if (error) throw new Error(`${key}: ${error.message}`);
}

async function main() {
  const overrides = await readSiteContent("course_overrides", {});
  const adminCourses = await readSiteContent("admin_courses", []);
  const siteSettings = await readSiteContent("site_settings", {});

  const migratedOverrides = migrateCourseOverrides(overrides);
  const migratedAdminCourses = migrateAdminCourses(adminCourses);
  const migratedSettings = migrateSiteSettings(siteSettings);

  console.log(`course_overrides: ${migratedOverrides.changed} lesson patch(es) cleaned`);
  console.log(`admin_courses: ${migratedAdminCourses.changed} lesson(s) cleaned`);
  console.log(`site_settings: ${migratedSettings.changed ? "vimeoPreviewDefault removed" : "no change"}`);

  if (dryRun) {
    console.log("\nDry run — nothing written.");
    return;
  }

  if (migratedOverrides.changed > 0) {
    await writeSiteContent("course_overrides", migratedOverrides.value);
  }
  if (migratedAdminCourses.changed > 0) {
    await writeSiteContent("admin_courses", migratedAdminCourses.value);
  }
  if (migratedSettings.changed) {
    await writeSiteContent("site_settings", migratedSettings.value);
  }

  console.log("\nDone — re-link video lessons in Admin → Cours → Vidéo uploadée.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
