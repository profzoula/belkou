/** Same-origin HLS proxy so belkou.online can play Cloudflare Tunnel / Mux streams. */

function isPrivateHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".local") || host === "0.0.0.0") return true;
  if (/^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host)) return true;
  if (/^169\.254\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host)) return true;
  return false;
}

export function parsePublicHlsUrl(raw: string): URL | null {
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== "https:") return null;
    if (isPrivateHostname(url.hostname)) return null;
    return url;
  } catch {
    return null;
  }
}

export function sameOriginHlsUrl(playbackUrl: string): string {
  const target = parsePublicHlsUrl(playbackUrl);
  if (!target) return playbackUrl;
  return `/api/hls-proxy?u=${encodeURIComponent(target.toString())}`;
}

export function rewriteHlsPlaylist(body: string, manifestUrl: URL): string {
  const proxied = (ref: string) => {
    try {
      const absolute = new URL(ref, manifestUrl);
      if (absolute.protocol !== "https:" || isPrivateHostname(absolute.hostname)) return ref;
      return `/api/hls-proxy?u=${encodeURIComponent(absolute.toString())}`;
    } catch {
      return ref;
    }
  };

  return body
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;
      if (trimmed.startsWith("#")) {
        return line.replace(/URI="([^"]+)"/g, (_match, uri: string) => `URI="${proxied(uri)}"`);
      }
      return proxied(trimmed);
    })
    .join("\n");
}

export function looksLikeHlsPlaylist(url: URL, contentType: string): boolean {
  return (
    url.pathname.includes(".m3u8") ||
    contentType.includes("mpegurl") ||
    contentType.includes("m3u8")
  );
}
