const ADMIN_TOKEN_KEY = "belkou_admin_token";

export function setAdminSessionToken(token: string): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function getAdminSessionToken(): string | null {
  if (typeof sessionStorage === "undefined") return null;
  return sessionStorage.getItem(ADMIN_TOKEN_KEY);
}

export function clearAdminSessionToken(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(ADMIN_TOKEN_KEY);
}

export function decodeAdminTokenExpiry(token: string): number | null {
  try {
    const [encoded] = token.split(".");
    if (!encoded) return null;
    const padded = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(padded);
    const payload = JSON.parse(json) as { exp?: number };
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

export function isAdminSessionTokenExpired(token: string | null, skewSec = 60): boolean {
  if (!token) return true;
  const exp = decodeAdminTokenExpiry(token);
  if (!exp) return true;
  return exp <= Math.floor(Date.now() / 1000) + skewSec;
}

export async function syncAdminSessionToken(
  refreshFn: () => Promise<{ ok: boolean; token?: string }>,
): Promise<boolean> {
  const current = getAdminSessionToken();
  if (current && !isAdminSessionTokenExpired(current)) {
    return true;
  }

  try {
    const result = await refreshFn();
    if (result.ok && result.token) {
      setAdminSessionToken(result.token);
      return true;
    }
  } catch {
    /* cookie session missing or expired */
  }

  return false;
}

export function isAdminAuthError(message: string): boolean {
  return /non autoris/i.test(message) || /admin non configur/i.test(message);
}
