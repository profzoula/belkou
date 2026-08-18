import { formatUsd } from "@/lib/money";

export const LIVE_PROVIDERS = ["youtube", "vimeo", "hls"] as const;
export const LIVE_STATUSES = ["scheduled", "live", "ended", "canceled"] as const;
export const LIVE_TICKET_PRICE_USD = 9.99;
export const LIVE_RECORDING_SECTION_TITLE = "Sessions live";
/** Lives that are not attached to a course. */
export const STANDALONE_LIVE_SLUG = "__live__";

export function isStandaloneLiveSlug(slug?: string | null): boolean {
  const trimmed = slug?.trim();
  return !trimmed || trimmed === STANDALONE_LIVE_SLUG;
}

const LIVE_TICKET_SLUG_PREFIX = `${STANDALONE_LIVE_SLUG}:`;

/** A ticket is sold per event, so its registration slug carries the session id. */
export function liveTicketSlug(sessionId: string): string {
  return `${LIVE_TICKET_SLUG_PREFIX}${sessionId.trim()}`;
}

export function parseLiveTicketSlug(slug?: string | null): string | null {
  const trimmed = slug?.trim() ?? "";
  if (!trimmed.startsWith(LIVE_TICKET_SLUG_PREFIX)) return null;
  return trimmed.slice(LIVE_TICKET_SLUG_PREFIX.length) || null;
}

/** Admins price each event; an unpriced event falls back to the default ticket. */
export function resolveLivePrice(priceUsd?: number | null): number {
  if (priceUsd == null || !Number.isFinite(priceUsd) || priceUsd < 0) {
    return LIVE_TICKET_PRICE_USD;
  }
  return Math.round(priceUsd * 100) / 100;
}

export function formatLivePrice(priceUsd?: number | null): string {
  const price = resolveLivePrice(priceUsd);
  if (price <= 0) return "Gratuit";
  return formatUsd(price);
}

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
  thumbnailUrl: string | null;
  /** Null until an admin sets a price — see `resolveLivePrice`. */
  priceUsd: number | null;
  createdAt: string;
};

export type LiveComment = {
  id: string;
  sessionId: string;
  authorUserId: string;
  authorName: string;
  authorAvatarUrl?: string;
  body: string;
  createdAt: string;
  mine?: boolean;
};

export type LiveCourseInfo = {
  slug: string;
  title: string;
  instructor: string;
  price: number;
  originalPrice: number;
  studentsCount: number;
  description: string;
  thumbnail: {
    gradient: string;
    label: string;
    imageUrl?: string;
  };
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
  thumbnailUrl: string | null;
  ticketPrice: number;
  course: LiveCourseInfo;
};

export type PublicLiveSession = Omit<LiveSession, "playbackUrl"> & {
  playbackUrl?: string;
  canWatch: boolean;
  canComment: boolean;
  liveTicketPrice: number;
  /** Paid seats sold for this event. */
  reservedCount: number;
  course: LiveCourseInfo;
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

/**
 * Every announced hour is Haiti time. Pinning the zone keeps the server and the
 * browser on the same string, and the zone label stops a student abroad from
 * reading the hour as their own.
 */
export const LIVE_TIME_ZONE = "America/Port-au-Prince";

const LIVE_DATE_PARTS = {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
} as const;

function formatInZone(iso: string, timeZone: string | undefined, withZoneName: boolean): string {
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      ...LIVE_DATE_PARTS,
      ...(timeZone ? { timeZone } : {}),
      ...(withZoneName ? ({ timeZoneName: "short" } as const) : {}),
    });
  } catch {
    return iso;
  }
}

export function formatLiveSchedule(iso: string): string {
  return formatInZone(iso, LIVE_TIME_ZONE, true);
}

/** Same moment without the zone label — for sentences that already name it. */
export function formatLiveScheduleShort(iso: string): string {
  return formatInZone(iso, LIVE_TIME_ZONE, false);
}

/** The same moment in the reader's own zone. Client-side only. */
export function formatLiveScheduleLocal(iso: string): string {
  return formatInZone(iso, undefined, true);
}

/** True when the reader is not on Haiti time and needs the translated hour. */
export function viewerZoneDiffers(): boolean {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone !== LIVE_TIME_ZONE;
  } catch {
    return false;
  }
}

/**
 * Relative time to the start, or null once the event should have begun.
 * Keeps the wait concrete when the absolute date is days away.
 */
export function liveCountdownLabel(iso: string, now: number = Date.now()): string | null {
  const start = new Date(iso).getTime();
  if (!Number.isFinite(start)) return null;
  const ms = start - now;
  if (ms <= 0) return null;

  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return "dans moins d'une minute";
  if (minutes < 60) return `dans ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    const restMinutes = minutes % 60;
    return restMinutes > 0 ? `dans ${hours} h ${restMinutes} min` : `dans ${hours} h`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    const restHours = hours % 24;
    return restHours > 0 ? `dans ${days} j ${restHours} h` : `dans ${days} j`;
  }
  const weeks = Math.round(days / 7);
  return `dans ${weeks} semaine${weeks > 1 ? "s" : ""}`;
}

export function detectLiveProvider(url: string): LiveProvider {
  const trimmed = url.trim().toLowerCase();
  if (trimmed.includes("vimeo.com")) return "vimeo";
  if (trimmed.includes(".m3u8") || trimmed.includes("/hls")) return "hls";
  return "youtube";
}

export function liveEventThumbnail(
  session: { thumbnailUrl?: string | null },
  course: LiveCourseInfo,
): LiveCourseInfo["thumbnail"] {
  const imageUrl = session.thumbnailUrl?.trim() || course.thumbnail.imageUrl;
  return {
    gradient: course.thumbnail.gradient,
    label: course.thumbnail.label,
    ...(imageUrl ? { imageUrl } : {}),
  };
}
