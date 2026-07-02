export type VimeoRef = {
  id: string;
  hash?: string;
};

/** Accepts a numeric ID, player URL, or vimeo.com link (including private /hash). */
export function parseVimeoRef(input: string): VimeoRef | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (/^\d+$/.test(trimmed)) {
    return { id: trimmed };
  }

  try {
    const url = new URL(trimmed);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "player.vimeo.com") {
      const match = url.pathname.match(/^\/video\/(\d+)/);
      if (!match) return null;
      const hash = url.searchParams.get("h") ?? undefined;
      return { id: match[1], hash: hash || undefined };
    }

    if (host === "vimeo.com") {
      const parts = url.pathname.split("/").filter(Boolean);
      const id = parts.find((part) => /^\d+$/.test(part));
      if (!id) return null;
      const hashIndex = parts.indexOf(id) + 1;
      const hash = parts[hashIndex] && !/^\d+$/.test(parts[hashIndex]) ? parts[hashIndex] : undefined;
      return { id, hash };
    }
  } catch {
    return null;
  }

  return null;
}

const VIMEO_PLAYER_PARAMS = {
  badge: false,
  autopause: false,
  title: false,
  byline: false,
  portrait: false,
  dnt: true,
} as const;

export function buildVimeoEmbedUrl(ref: VimeoRef): string {
  const params = new URLSearchParams({
    badge: "0",
    autopause: "0",
    title: "0",
    byline: "0",
    portrait: "0",
    dnt: "1",
  });

  if (ref.hash) {
    params.set("h", ref.hash);
  }

  return `https://player.vimeo.com/video/${ref.id}?${params.toString()}`;
}

export function buildVimeoPlayerInit(ref: VimeoRef, width = 640) {
  const common = {
    ...VIMEO_PLAYER_PARAMS,
    responsive: true,
    width,
  };

  if (ref.hash) {
    return {
      ...common,
      url: buildVimeoEmbedUrl(ref),
    };
  }

  return {
    ...common,
    id: Number(ref.id),
  };
}
