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
