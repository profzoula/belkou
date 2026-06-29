import { getSupabaseAdmin } from "@/server/supabase-registrations";

const BUCKET = "course-resources";
const MAX_BYTES = 25 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/epub+zip",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  "application/zip",
  "application/x-zip-compressed",
]);

function extensionForContentType(contentType: string, fileName: string): string {
  const fromName = fileName.includes(".") ? fileName.split(".").pop()?.toLowerCase() : undefined;
  if (fromName) return fromName;

  switch (contentType) {
    case "application/pdf":
      return "pdf";
    case "application/msword":
      return "doc";
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return "docx";
    case "application/epub+zip":
      return "epub";
    case "application/vnd.ms-excel":
      return "xls";
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      return "xlsx";
    case "text/csv":
      return "csv";
    case "text/plain":
      return "txt";
    case "application/zip":
    case "application/x-zip-compressed":
      return "zip";
    default:
      return "bin";
  }
}

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^\w.\-() ]+/g, "_").trim() || "resource";
}

export async function uploadCourseResource(params: {
  courseSlug: string;
  contentType: string;
  dataBase64: string;
  fileName: string;
}): Promise<
  | { ok: true; publicUrl: string; fileName: string; contentType: string }
  | { ok: false; reason: string }
> {
  const sb = getSupabaseAdmin();
  if (!sb) {
    return { ok: false, reason: "Supabase non configuré (SUPABASE_SERVICE_ROLE_KEY)" };
  }

  const contentType = params.contentType.trim().toLowerCase();
  if (!ALLOWED_TYPES.has(contentType)) {
    return {
      ok: false,
      reason: "Format non supporté (PDF, Word, Excel, EPUB, TXT, CSV, ZIP)",
    };
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
    return { ok: false, reason: "Fichier trop volumineux (max 25 Mo)" };
  }

  const safeName = sanitizeFileName(params.fileName);
  const ext = extensionForContentType(contentType, safeName);
  const path = `${slug}/${Date.now()}-${safeName.replace(/\s+/g, "-")}.${ext}`;

  const { error } = await sb.storage.from(BUCKET).upload(path, buffer, {
    contentType,
    upsert: false,
  });

  if (error) {
    if (error.message.includes("Bucket not found") || error.message.includes("does not exist")) {
      return {
        ok: false,
        reason: "Bucket course-resources manquant — exécutez supabase/course_resources_storage.sql",
      };
    }
    console.error("[BelKou] course resource upload:", error.message);
    return { ok: false, reason: error.message };
  }

  const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
  return {
    ok: true,
    publicUrl: data.publicUrl,
    fileName: safeName,
    contentType,
  };
}
