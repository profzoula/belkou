import { getSupabase } from "@/lib/supabase/client";

export const VIDEO_UPLOAD_ACCEPT = "video/mp4,video/quicktime,.mp4,.mov";
export const VIDEO_UPLOAD_MAX_BYTES = 2 * 1024 * 1024 * 1024;

const BUCKET = "course-videos";

export function defaultVideoTitleFromFileName(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
}

export function normalizeVideoContentType(file: File): string {
  const raw = file.type?.trim().toLowerCase();
  if (raw === "video/mp4" || raw === "video/quicktime") return raw;

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "mov") return "video/quicktime";
  return "video/mp4";
}

function fileWithNormalizedType(file: File): File {
  const contentType = normalizeVideoContentType(file);
  if (file.type === contentType) return file;
  return new File([file], file.name, { type: contentType, lastModified: file.lastModified });
}

async function uploadWithXhrFormData(
  file: File,
  signedUrl: string,
  onProgress?: (percent: number) => void,
): Promise<void> {
  const formData = new FormData();
  formData.append("cacheControl", "3600");
  formData.append("", file);

  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", signedUrl);
    xhr.setRequestHeader("x-upsert", "true");
    if (anonKey) {
      xhr.setRequestHeader("apikey", anonKey);
      xhr.setRequestHeader("Authorization", `Bearer ${anonKey}`);
    }

    xhr.upload.onprogress = (event) => {
      if (!onProgress || !event.lengthComputable) return;
      onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
        return;
      }

      let message = `Upload stockage échoué (${xhr.status})`;
      try {
        const body = JSON.parse(xhr.responseText) as { message?: string; error?: string };
        message = body.message ?? body.error ?? message;
      } catch {
        if (xhr.responseText?.trim()) {
          message = xhr.responseText.trim().slice(0, 200);
        }
      }
      reject(new Error(message));
    };

    xhr.onerror = () =>
      reject(new Error("Upload stockage échoué (réseau ou CORS — vérifiez Supabase Storage)"));
    xhr.onabort = () => reject(new Error("Upload annulé"));
    xhr.send(formData);
  });
}

async function uploadWithSupabaseClient(
  file: File,
  storagePath: string,
  token: string,
  onProgress?: (percent: number) => void,
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("Supabase non configuré côté client");
  }

  const contentType = normalizeVideoContentType(file);
  onProgress?.(5);

  const { error } = await supabase.storage.from(BUCKET).uploadToSignedUrl(storagePath, token, file, {
    contentType,
    upsert: true,
    cacheControl: "3600",
  });

  if (error) {
    throw new Error(error.message);
  }

  onProgress?.(100);
}

export async function uploadVideoToSignedStorage(
  file: File,
  params: {
    signedUrl: string;
    token: string;
    storagePath: string;
  },
  onProgress?: (percent: number) => void,
): Promise<void> {
  const typedFile = fileWithNormalizedType(file);

  try {
    await uploadWithXhrFormData(typedFile, params.signedUrl, onProgress);
    return;
  } catch (xhrError) {
    try {
      await uploadWithSupabaseClient(typedFile, params.storagePath, params.token, onProgress);
    } catch (clientError) {
      const xhrMsg = xhrError instanceof Error ? xhrError.message : "Upload échoué";
      const clientMsg = clientError instanceof Error ? clientError.message : xhrMsg;
      throw new Error(clientMsg);
    }
  }
}

/** @deprecated Use uploadVideoToSignedStorage */
export async function uploadFileToSignedUrl(
  file: File,
  signedUrl: string,
  onProgress?: (percent: number) => void,
): Promise<void> {
  await uploadWithXhrFormData(fileWithNormalizedType(file), signedUrl, onProgress);
}
