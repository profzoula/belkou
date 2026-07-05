export const ADMIN_COOKIE_NAME = "belkou_admin";
const COOKIE_NAME = ADMIN_COOKIE_NAME;
const MAX_AGE_SEC = 60 * 60 * 24 * 7;

type AdminPayload = {
  u: string;
  exp: number;
};

function toBase64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

async function hmacSign(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return toBase64Url(new Uint8Array(signature));
}

async function hmacVerify(message: string, signature: string, secret: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  try {
    return await crypto.subtle.verify(
      "HMAC",
      key,
      fromBase64Url(signature),
      new TextEncoder().encode(message),
    );
  } catch {
    return false;
  }
}

export async function createAdminToken(username: string, secret: string): Promise<string> {
  const payload: AdminPayload = {
    u: username,
    exp: Math.floor(Date.now() / 1000) + MAX_AGE_SEC,
  };
  const encoded = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await hmacSign(encoded, secret);
  return `${encoded}.${signature}`;
}

export async function verifyAdminToken(token: string, secret: string): Promise<AdminPayload | null> {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const valid = await hmacVerify(encoded, signature, secret);
  if (!valid) return null;

  try {
    const json = new TextDecoder().decode(fromBase64Url(encoded));
    const payload = JSON.parse(json) as AdminPayload;
    if (!payload.u || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function adminCookieHeader(token: string, secure: boolean): string {
  const flags = ["Path=/", "HttpOnly", "SameSite=Lax", `Max-Age=${MAX_AGE_SEC}`];
  if (secure) flags.push("Secure");
  return `${COOKIE_NAME}=${token}; ${flags.join("; ")}`;
}

export function clearAdminCookieHeader(secure: boolean): string {
  const flags = ["Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0"];
  if (secure) flags.push("Secure");
  return `${COOKIE_NAME}=; ${flags.join("; ")}`;
}

export function getAdminCookie(cookieHeader: string | null): string | undefined {
  if (!cookieHeader) return undefined;
  const parts = cookieHeader.split(";").map((p) => p.trim());
  for (const part of parts) {
    if (part.startsWith(`${COOKIE_NAME}=`)) {
      return decodeURIComponent(part.slice(COOKIE_NAME.length + 1));
    }
  }
  return undefined;
}

export async function verifyAdminSessionToken(
  token: string | undefined,
  secret: string | undefined,
): Promise<string | null> {
  if (!secret || !token) return null;
  const payload = await verifyAdminToken(token, secret);
  return payload?.u ?? null;
}

export async function getAdminFromRequest(
  cookieHeader: string | null,
  secret: string | undefined,
): Promise<string | null> {
  if (!secret) return null;
  const token = getAdminCookie(cookieHeader);
  return verifyAdminSessionToken(token, secret);
}

export async function getAdminFromRequestSources(
  sources: {
    cookieHeader?: string | null;
    cookieValue?: string | null;
    authorization?: string | null;
    adminToken?: string | null;
  },
  secret: string | undefined,
): Promise<string | null> {
  if (!secret) return null;

  const candidates = [
    sources.cookieValue ?? undefined,
    getAdminCookie(sources.cookieHeader ?? null),
    sources.authorization?.startsWith("Bearer ")
      ? sources.authorization.slice("Bearer ".length).trim()
      : undefined,
    sources.adminToken?.trim() || undefined,
  ];

  for (const token of candidates) {
    const username = await verifyAdminSessionToken(token, secret);
    if (username) return username;
  }

  return null;
}
