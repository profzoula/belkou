import { avatarUrlFromUser } from "@/lib/user-avatar";
import { getSupabaseAdmin } from "@/server/supabase-registrations";

type CacheEntry = { url: string | undefined; at: number };

const cache = new Map<string, CacheEntry>();
const TTL_MS = 10 * 60 * 1000;

export async function getAvatarUrlsByUserId(userIds: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(userIds.map((id) => id.trim()).filter(Boolean))];
  const result = new Map<string, string>();
  const missing: string[] = [];
  const now = Date.now();

  for (const id of unique) {
    const hit = cache.get(id);
    if (hit && now - hit.at < TTL_MS) {
      if (hit.url) result.set(id, hit.url);
    } else {
      missing.push(id);
    }
  }

  if (!missing.length) return result;

  const sb = getSupabaseAdmin();
  if (!sb) return result;

  await Promise.all(
    missing.map(async (id) => {
      try {
        const { data } = await sb.auth.admin.getUserById(id);
        const url = avatarUrlFromUser(data?.user);
        cache.set(id, { url, at: Date.now() });
        if (url) result.set(id, url);
      } catch {
        cache.set(id, { url: undefined, at: Date.now() });
      }
    }),
  );

  return result;
}

export async function withAuthorAvatars<T extends { authorUserId: string }>(
  items: T[],
): Promise<Array<T & { authorAvatarUrl?: string }>> {
  if (!items.length) return items;
  const avatars = await getAvatarUrlsByUserId(items.map((item) => item.authorUserId));
  return items.map((item) => {
    const url = avatars.get(item.authorUserId);
    return url ? { ...item, authorAvatarUrl: url } : item;
  });
}
