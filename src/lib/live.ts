export const LIVE_PROVIDERS = ["youtube", "vimeo", "hls"] as const;
export const LIVE_STATUSES = ["scheduled", "live", "ended", "canceled"] as const;
export const LIVE_TICKET_PRICE_USD = 9.99;
export const LIVE_RECORDING_SECTION_TITLE = "Sessions live";

export type LiveProvider = (typeof LIVE_PROVIDERS)[number];
export type LiveStatus = (typeof LIVE_STATUSES)[number];

export type LiveSession = {
  id: string;
  courseSlug: string;
  courseTitle: string;
  title: string;
  description: string;
  status: LiveStatus;
  provider: LiveProvider;
  playbackUrl: string;
  scheduledAt: string;
  startedAt: string | null;
  endedAt: string | null;
  recordingUrl: string | null;
  recordingLessonId: string | null;
  createdAt: string;
};

export type LiveComment = {
  id: string;
  sessionId: string;
  authorUserId: string;
  authorName: string;
  body: string;
  createdAt: string;
  mine?: boolean;
};

export type PublicLiveListItem = {
  id: string;
  courseSlug: string;
  courseTitle: string;
  title: string;
  description: string;
  status: LiveStatus;
  provider: LiveProvider;
  scheduledAt: string;
  startedAt: string | null;
  endedAt: string | null;
  recordingLessonId: string | null;
};

export type PublicLiveSession = Omit<LiveSession, "playbackUrl"> & {
  playbackUrl?: string;
  canWatch: boolean;
  canComment: boolean;
  hasCourseAccess: boolean;
  liveTicketPrice: number;
};

export function liveStatusLabel(status: LiveStatus): string {
  switch (status) {
    case "live":
      return "En direct";
    case "ended":
      return "Replay";
    case "canceled":
      return "Annulé";
    default:
      return "Programmé";
  }
}

export function liveProviderLabel(provider: LiveProvider): string {
  switch (provider) {
    case "vimeo":
      return "Vimeo Live";
    case "hls":
      return "HLS (Mux / Cloudflare)";
    default:
      return "YouTube Live";
  }
}

export function formatLiveSchedule(iso: string): string {
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function detectLiveProvider(url: string): LiveProvider {
  const trimmed = url.trim().toLowerCase();
  if (trimmed.includes("vimeo.com")) return "vimeo";
  if (trimmed.includes(".m3u8") || trimmed.includes("/hls")) return "hls";
  return "youtube";
}
