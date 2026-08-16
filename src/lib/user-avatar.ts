export function avatarUrlFromUser(user: {
  user_metadata?: Record<string, unknown> | null;
} | null | undefined): string | undefined {
  const meta = user?.user_metadata ?? {};
  for (const value of [meta.avatar_url, meta.picture]) {
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
  }
  return undefined;
}
