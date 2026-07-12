import { getAdminFromRequestSources } from "@/lib/admin-auth";
import { getServerEnvResolved } from "@/server/env";
import { getSupabaseAdmin } from "@/server/supabase-registrations";

const BUCKET = "course-videos";

function readMaxMb(raw: string | undefined, fallbackMb: number): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallbackMb;
  return parsed;
}

const VIDEO_UPLOAD_MAX_BYTES =
  readMaxMb(process.env.VIDEO_UPLOAD_MAX_MB ?? process.env.VITE_VIDEO_UPLOAD_MAX_MB, 50) *
  1024 *
  1024;

const ALLOWED_TYPES = new Set(["video/mp4", "video/quicktime"]);

function normalizeVideoContentType(fileName: string, rawType: string): string {
  const type = rawType.trim().toLowerCase();
  if (ALLOWED_TYPES.has(type)) return type;
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "mov") return "video/quicktime";
  return "video/mp4";
}

function formatMaxLabel(): string {
  const mb = VIDEO_UPLOAD_MAX_BYTES / (1024 * 1024);
  return mb >= 1024 ? `${mb / 1024} Go` : `${mb} Mo`;
}

function mapStorageError(message: string): string {
  const lower = message.toLowerCase();
  if (
    lower.includes("maximum") ||
    lower.includes("file size") ||
    lower.includes("too large") ||
    lower.includes("payload") ||
    lower.includes("50")
  ) {
    return "Fichier trop volumineux pour Supabase (max 50 Mo sur plan Free). Compressez le MP4 ou passez au plan Pro.";
  }
  if (lower.includes("mime") || lower.includes("content type")) {
    return "Format non supporté — utilisez un fichier MP4 ou MOV.";
  }
  return message;
}

export async function handleAdminVideoUpload(request: Request): Promise<Response> {
  const env = await getServerEnvResolved();
  if (!env.ADMIN_PASSWORD) {
    return json({ error: "Admin non configuré" }, 503);
  }

  const admin = await getAdminFromRequestSources(
    {
      cookieHeader: request.headers.get("cookie"),
      authorization: request.headers.get("authorization"),
      adminToken: request.headers.get("x-admin-token"),
    },
    env.ADMIN_PASSWORD,
  );
  if (!admin) {
    return json({ error: "Non autorisé" }, 401);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return json({ error: "Corps de requête invalide" }, 400);
  }

  const videoId = String(formData.get("videoId") ?? "").trim();
  const storagePath = String(formData.get("storagePath") ?? "").trim();
  const fileValue = formData.get("file");

  if (!videoId || !storagePath || !(fileValue instanceof File)) {
    return json({ error: "videoId, storagePath et file requis" }, 400);
  }

  if (!storagePath.startsWith(`source/${videoId}/`)) {
    return json({ error: "Chemin de stockage invalide" }, 400);
  }

  if (fileValue.size <= 0) {
    return json({ error: "Fichier vide" }, 400);
  }
  if (fileValue.size > VIDEO_UPLOAD_MAX_BYTES) {
    return json({ error: `Fichier trop volumineux (max ${formatMaxLabel()})` }, 400);
  }

  const sb = getSupabaseAdmin();
  if (!sb) {
    return json({ error: "Supabase non configuré (SUPABASE_SERVICE_ROLE_KEY)" }, 503);
  }

  const contentType = normalizeVideoContentType(fileValue.name, fileValue.type || "video/mp4");
  const buffer = Buffer.from(await fileValue.arrayBuffer());

  const { error } = await sb.storage.from(BUCKET).upload(storagePath, buffer, {
    contentType,
    upsert: true,
  });

  if (error) {
    console.error("[BelKou] admin video upload:", error.message);
    return json({ error: mapStorageError(error.message) }, 400);
  }

  return json({ ok: true }, 200);
}

function json(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
