import { getSupabaseAdmin } from "@/server/supabase-registrations";

const BUCKET = "course-thumbnails";
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function extensionForContentType(contentType: string): string {
  switch (contentType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "jpg";
  }
}

export async function uploadCourseThumbnail(params: {
  courseSlug: string;
  contentType: string;
  dataBase64: string;
}): Promise<{ ok: true; publicUrl: string } | { ok: false; reason: string }> {
  const sb = getSupabaseAdmin();
  if (!sb) {
    return { ok: false, reason: "Supabase non configuré (SUPABASE_SERVICE_ROLE_KEY)" };
  }

  const contentType = params.contentType.trim().toLowerCase();
  if (!ALLOWED_TYPES.has(contentType)) {
    return { ok: false, reason: "Format non supporté (JPG, PNG, WebP, GIF)" };
  }

  const slug = params.courseSlug.trim().toLowerCase();
  if (!slug) {
    return { ok: false, reason: "Cours invalide" };
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(params.dataBase64, "base64");
  } catch {
    return { ok: false, reason: "Fichier invalide" };
  }

  if (buffer.length === 0) {
    return { ok: false, reason: "Fichier vide" };
  }
  if (buffer.length > MAX_BYTES) {
    return { ok: false, reason: "Image trop volumineuse (max 5 Mo)" };
  }

  const path = `${slug}/${Date.now()}.${extensionForContentType(contentType)}`;
  const { error } = await sb.storage.from(BUCKET).upload(path, buffer, {
    contentType,
    upsert: false,
  });

  if (error) {
    if (error.message.includes("Bucket not found") || error.message.includes("does not exist")) {
      return {
        ok: false,
        reason: "Bucket course-thumbnails manquant — exécutez supabase/course_thumbnails_storage.sql",
      };
    }
    console.error("[BelKou] thumbnail upload:", error.message);
    return { ok: false, reason: error.message };
  }

  const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
  return { ok: true, publicUrl: data.publicUrl };
}
