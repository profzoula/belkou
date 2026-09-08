import { getSupabaseAdmin } from "@/server/supabase-registrations";

const BUCKET = "blog-images";
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

function safeFolder(input: string): string {
  return (
    input
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64) || "article"
  );
}

export function isBlogStorageImageUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  return /\/storage\/v1\/object\/public\/blog-images\//i.test(url);
}

export async function uploadBlogImage(params: {
  postId: string;
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

  const folder = safeFolder(params.postId);
  const path = `${folder}/${Date.now()}.${extensionForContentType(contentType)}`;
  const { error } = await sb.storage.from(BUCKET).upload(path, buffer, {
    contentType,
    upsert: false,
  });

  if (error) {
    if (error.message.includes("Bucket not found") || error.message.includes("does not exist")) {
      return {
        ok: false,
        reason: "Bucket blog-images manquant — exécutez supabase/blog_images_storage.sql",
      };
    }
    console.error("[BelKou] blog image upload:", error.message);
    return { ok: false, reason: error.message };
  }

  const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
  return { ok: true, publicUrl: data.publicUrl };
}

export type BlogStorageImage = {
  postId: string;
  path: string;
  publicUrl: string;
  updatedAt: string | null;
};

/** Liste les images uploadées par article (dossier = postId). */
export async function listBlogStorageImages(): Promise<
  { ok: true; images: BlogStorageImage[] } | { ok: false; reason: string }
> {
  const sb = getSupabaseAdmin();
  if (!sb) {
    return { ok: false, reason: "Supabase non configuré (SUPABASE_SERVICE_ROLE_KEY)" };
  }

  const { data: roots, error: rootError } = await sb.storage.from(BUCKET).list("", {
    limit: 1000,
    sortBy: { column: "name", order: "asc" },
  });
  if (rootError) {
    return { ok: false, reason: rootError.message };
  }

  const images: BlogStorageImage[] = [];
  for (const root of roots ?? []) {
    const name = root.name?.trim();
    if (!name || name.includes(".")) continue;
    const { data: files, error: listError } = await sb.storage.from(BUCKET).list(name, {
      limit: 200,
      sortBy: { column: "name", order: "asc" },
    });
    if (listError) {
      console.warn(`[BelKou] blog-images list ${name}:`, listError.message);
      continue;
    }
    for (const file of files ?? []) {
      if (!file.name || file.name.endsWith("/")) continue;
      if (!/\.(jpe?g|png|webp|gif)$/i.test(file.name)) continue;
      const path = `${name}/${file.name}`;
      const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
      images.push({
        postId: name,
        path,
        publicUrl: data.publicUrl,
        updatedAt: file.updated_at ?? file.created_at ?? null,
      });
    }
  }

  images.sort((a, b) => {
    const byPost = a.postId.localeCompare(b.postId);
    if (byPost) return byPost;
    return (a.updatedAt ?? a.path).localeCompare(b.updatedAt ?? b.path);
  });

  return { ok: true, images };
}
