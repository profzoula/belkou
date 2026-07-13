export type ParsedVimeoUrl = {
  id: string;
  hash?: string;
};

export function parseVimeoUrl(url: string): ParsedVimeoUrl | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  const playerMatch = trimmed.match(
    /player\.vimeo\.com\/video\/(\d+)(?:\?(?:.*&)?h=([a-zA-Z0-9]+))?/,
  );
  if (playerMatch) {
    return { id: playerMatch[1], hash: playerMatch[2] };
  }

  const vimeoMatch = trimmed.match(/vimeo\.com\/(\d+)(?:\/([a-zA-Z0-9]+))?/);
  if (vimeoMatch) {
    return { id: vimeoMatch[1], hash: vimeoMatch[2] };
  }

  if (/^\d+$/.test(trimmed)) {
    return { id: trimmed };
  }

  return null;
}

export function isValidVimeoUrl(url: string): boolean {
  return parseVimeoUrl(url) !== null;
}

export function buildVimeoEmbedUrl(parsed: ParsedVimeoUrl): string {
  const params = new URLSearchParams({
    api: "1",
    title: "0",
    byline: "0",
    portrait: "0",
    dnt: "1",
  });
  if (parsed.hash) params.set("h", parsed.hash);
  return `https://player.vimeo.com/video/${parsed.id}?${params}`;
}

export function vimeoUrlToEmbedUrl(url: string): string | null {
  const parsed = parseVimeoUrl(url);
  if (!parsed) return null;
  return buildVimeoEmbedUrl(parsed);
}
