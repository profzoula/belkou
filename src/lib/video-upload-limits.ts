/** Supabase Free plan global storage cap (cannot be overridden by bucket SQL). */
export const SUPABASE_FREE_MAX_BYTES = 50 * 1024 * 1024;

export const VIDEO_UPLOAD_ACCEPT = "video/mp4,video/quicktime,.mp4,.mov";

function readMaxMb(raw: string | undefined, fallbackMb: number): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallbackMb;
  return parsed;
}

/** Client-visible upload cap (default 50 Mo = Supabase Free). Set VITE_VIDEO_UPLOAD_MAX_MB on Pro. */
export const VIDEO_UPLOAD_MAX_MB = readMaxMb(import.meta.env.VITE_VIDEO_UPLOAD_MAX_MB, 50);

export const VIDEO_UPLOAD_MAX_BYTES = VIDEO_UPLOAD_MAX_MB * 1024 * 1024;

export function formatVideoUploadMaxLabel(): string {
  if (VIDEO_UPLOAD_MAX_MB >= 1024) {
    const gb = VIDEO_UPLOAD_MAX_MB / 1024;
    return Number.isInteger(gb) ? `${gb} Go` : `${gb.toFixed(1)} Go`;
  }
  return `${VIDEO_UPLOAD_MAX_MB} Mo`;
}

export function getVideoUploadLimitHint(): string {
  if (VIDEO_UPLOAD_MAX_MB <= 50) {
    return `Max ${formatVideoUploadMaxLabel()} par fichier (limite Supabase Free). Au-delà, uploadez sur Vimeo et collez le lien ci-dessous.`;
  }
  return `Max ${formatVideoUploadMaxLabel()} par fichier. Pour des fichiers plus lourds, utilisez Vimeo.`;
}
