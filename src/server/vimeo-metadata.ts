import { formatCourseDurationLabel } from "@/lib/courses";
import { buildVimeoPageUrl, parseVimeoRef } from "@/lib/vimeo";

export function formatDurationFromSeconds(seconds: number): string {
  const totalMinutes = Math.max(1, Math.round(seconds / 60));
  return formatCourseDurationLabel(totalMinutes);
}

async function fetchOEmbedDurationSeconds(vimeoInput: string): Promise<number | null> {
  const ref = parseVimeoRef(vimeoInput);
  if (!ref) return null;

  const pageUrl = buildVimeoPageUrl(ref);
  const endpoint = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(pageUrl)}`;

  const response = await fetch(endpoint, {
    headers: { Accept: "application/json", "User-Agent": "BelKou/1.0" },
  });

  if (!response.ok) return null;

  const data = (await response.json()) as { duration?: unknown };
  if (typeof data.duration !== "number" || data.duration <= 0) return null;
  return data.duration;
}

async function fetchApiDurationSeconds(vimeoInput: string): Promise<number | null> {
  const token = process.env.VIMEO_ACCESS_TOKEN?.trim();
  if (!token) return null;

  const ref = parseVimeoRef(vimeoInput);
  if (!ref) return null;

  const url = new URL(`https://api.vimeo.com/videos/${ref.id}`);
  url.searchParams.set("fields", "duration");
  if (ref.hash) url.searchParams.set("password", ref.hash);

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/vnd.vimeo.*+json;version=3.4",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) return null;

  const data = (await response.json()) as { duration?: unknown };
  if (typeof data.duration !== "number" || data.duration <= 0) return null;
  return data.duration;
}

export async function fetchVimeoDurationLabel(vimeoInput: string): Promise<string | null> {
  const trimmed = vimeoInput.trim();
  if (!trimmed || !parseVimeoRef(trimmed)) return null;

  const seconds =
    (await fetchOEmbedDurationSeconds(trimmed)) ?? (await fetchApiDurationSeconds(trimmed));

  if (!seconds) return null;
  return formatDurationFromSeconds(seconds);
}
