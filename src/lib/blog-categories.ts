import { blogCategories as defaultBlogCategories } from "@/lib/blog";

export type BlogCategoryItem = {
  id: string;
  label: string;
};

export function slugifyBlogCategoryId(label: string): string {
  return label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export const DEFAULT_BLOG_CATEGORIES: BlogCategoryItem[] = defaultBlogCategories.map(
  (label) => ({
    id: slugifyBlogCategoryId(label),
    label,
  }),
);

export function sanitizeBlogCategoryList(raw: unknown): BlogCategoryItem[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: BlogCategoryItem[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const label = String((item as { label?: string }).label ?? "").trim();
    if (label.length < 2) continue;
    let id = String((item as { id?: string }).id ?? "").trim() || slugifyBlogCategoryId(label);
    id = slugifyBlogCategoryId(id);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push({ id, label: label.slice(0, 80) });
  }
  return out;
}
