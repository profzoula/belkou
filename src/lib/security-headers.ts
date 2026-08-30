/**
 * Browser security headers applied to every public response.
 * Tuned for Square redirects, Google/Supabase OAuth, YouTube/Vimeo embeds,
 * HLS playback, and Google Fonts — without opening framing or MIME sniffing.
 */
export const SECURITY_HEADERS: Record<string, string> = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
  "Content-Security-Policy": [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self' https://accounts.google.com https://squareup.com https://*.squareup.com https://square.link",
    "frame-ancestors 'self'",
    "object-src 'none'",
    "script-src 'self' 'unsafe-inline' https://connect.facebook.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob: https:",
    "worker-src 'self' blob:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://accounts.google.com https://www.facebook.com https://connect.facebook.net https://*.facebook.com https://connect.squareup.com https://connect.squareupsandbox.com",
    "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://squareup.com https://*.squareup.com https://square.link https://www.facebook.com https://connect.facebook.net",
    "upgrade-insecure-requests",
  ].join("; "),
};

export function applySecurityHeaders(headers: Headers): Headers {
  const next = new Headers(headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    if (!next.has(name)) next.set(name, value);
  }
  return next;
}

export function withSecurityHeaders(response: Response): Response {
  const headers = applySecurityHeaders(response.headers);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
