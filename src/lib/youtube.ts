export type ParsedYoutubeUrl = {
  id: string;
};

export function parseYoutubeUrl(url: string): ParsedYoutubeUrl | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return { id: trimmed };
  }

  try {
    const parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id ? { id: id.slice(0, 11) } : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      const v = parsed.searchParams.get("v");
      if (v) return { id: v.slice(0, 11) };

      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts[0] === "embed" || parts[0] === "live" || parts[0] === "shorts") {
        const id = parts[1];
        return id ? { id: id.slice(0, 11) } : null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function isValidYoutubeUrl(url: string): boolean {
  return parseYoutubeUrl(url) !== null;
}

export function buildYoutubeEmbedUrl(
  id: string,
  live = false,
  options?: { nativeFullscreen?: boolean },
): string {
  const params = new URLSearchParams({
    autoplay: live ? "1" : "0",
    modestbranding: "1",
    rel: "0",
    playsinline: "1",
  });
  if (options?.nativeFullscreen === false) params.set("fs", "0");
  return `https://www.youtube.com/embed/${id}?${params.toString()}`;
}

export function youtubeUrlToEmbedUrl(
  url: string,
  live = false,
  options?: { nativeFullscreen?: boolean },
): string | null {
  const parsed = parseYoutubeUrl(url);
  if (!parsed) return null;
  return buildYoutubeEmbedUrl(parsed.id, live, options);
}
