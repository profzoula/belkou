import { getSupabaseAdmin } from "@/server/supabase-registrations";

const LESSON_NOTES_KEY = "lesson_notes";

type LessonNotesStore = Record<string, Record<string, Record<string, string>>>;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function readNotesStore(): Promise<LessonNotesStore> {
  const sb = getSupabaseAdmin();
  if (!sb) return {};

  const { data, error } = await sb.from("site_content").select("value").eq("key", LESSON_NOTES_KEY).maybeSingle();
  if (error || !data?.value) return {};
  return (data.value as LessonNotesStore) ?? {};
}

async function writeNotesStore(store: LessonNotesStore): Promise<{ ok: boolean; reason?: string }> {
  const sb = getSupabaseAdmin();
  if (!sb) {
    return { ok: false, reason: "Supabase non configuré" };
  }

  const { error } = await sb.from("site_content").upsert(
    {
      key: LESSON_NOTES_KEY,
      value: store,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );

  if (error) {
    return { ok: false, reason: error.message };
  }

  return { ok: true };
}

export async function listLessonNotesForCourse(
  email: string,
  courseSlug: string,
): Promise<Record<string, string>> {
  const store = await readNotesStore();
  return store[normalizeEmail(email)]?.[courseSlug] ?? {};
}

export async function saveLessonNote(params: {
  email: string;
  courseSlug: string;
  lessonId: string;
  text: string;
}): Promise<{ ok: boolean; reason?: string }> {
  const email = normalizeEmail(params.email);
  const text = params.text.trim();
  const store = await readNotesStore();
  const userNotes = store[email] ?? {};
  const courseNotes = { ...(userNotes[params.courseSlug] ?? {}) };

  if (!text) {
    delete courseNotes[params.lessonId];
  } else {
    courseNotes[params.lessonId] = text;
  }

  store[email] = {
    ...userNotes,
    [params.courseSlug]: courseNotes,
  };

  return writeNotesStore(store);
}
