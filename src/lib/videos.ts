export const VIDEO_STATUSES = ["queued", "processing", "ready", "failed"] as const;

export type VideoStatus = (typeof VIDEO_STATUSES)[number];

export type VideoRecord = {
  id: string;
  title: string;
  filename: string;
  originalSize: number | null;
  durationSeconds: number | null;
  status: VideoStatus;
  storagePath: string | null;
  hlsPath: string | null;
  posterPath: string | null;
  previewPath: string | null;
  errorMessage: string | null;
  courseSlug: string | null;
  lessonId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type VideoPlaybackSource = {
  kind: "hls" | "mp4";
  url: string;
  posterUrl?: string;
  durationSeconds?: number | null;
  status: string;
};

export function formatVideoStatusLabel(status: VideoStatus): string {
  switch (status) {
    case "queued":
      return "En file";
    case "processing":
      return "Traitement";
    case "ready":
      return "Prêt";
    case "failed":
      return "Échec";
  }
}

export function formatVideoDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return "—";
  const total = Math.round(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

export function formatVideoSize(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return "—";
  const units = ["o", "Ko", "Mo", "Go"] as const;
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value < 10 && unit > 0 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`;
}
