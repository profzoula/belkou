/**
 * Course categories — defaults ship in code; admin can override via site_content.
 */

export type CourseCategory = {
  id: string;
  label: string;
};

export const DEFAULT_COURSE_CATEGORIES: CourseCategory[] = [
  { id: "dropshipping", label: "Dropshipping" },
  { id: "developpement-app", label: "Développement App" },
  { id: "marketing-digital", label: "Marketing Digital" },
  { id: "shopify-shop", label: "Shopify Shop" },
  { id: "facebook-ads", label: "Facebook Ads" },
  { id: "powershell-cmd", label: "Powershell & CMD" },
  { id: "ebook", label: "Ebook" },
];

/** @deprecated Prefer getResolvedCourseCategories() / DEFAULT_COURSE_CATEGORIES */
export const COURSE_CATEGORIES = DEFAULT_COURSE_CATEGORIES;

/** @deprecated Use string ids from resolved categories */
export type CourseCategoryId = string;

export function slugifyCategoryId(label: string): string {
  return label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function isValidCategoryId(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.trim()) && value.trim().length >= 2;
}

export function isCourseCategoryId(
  value: string,
  allowed?: Iterable<string>,
): boolean {
  const id = value.trim();
  if (!id) return false;
  if (allowed) {
    return new Set(allowed).has(id);
  }
  return DEFAULT_COURSE_CATEGORIES.some((c) => c.id === id) || isValidCategoryId(id);
}

export function normalizeCourseCategories(
  values: unknown,
  allowedIds?: Iterable<string>,
): string[] {
  const allowed = allowedIds ? new Set(allowedIds) : null;
  if (!Array.isArray(values)) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    if (typeof value !== "string") continue;
    const id = value.trim();
    if (!id || seen.has(id)) continue;
    if (allowed) {
      if (!allowed.has(id)) continue;
    } else if (!isValidCategoryId(id) && !DEFAULT_COURSE_CATEGORIES.some((c) => c.id === id)) {
      continue;
    }
    seen.add(id);
    result.push(id);
  }
  return result;
}

export function getCourseCategoryLabel(
  id: string,
  categories: CourseCategory[] = DEFAULT_COURSE_CATEGORIES,
): string {
  return categories.find((c) => c.id === id)?.label ?? id;
}

export function sanitizeCategoryList(input: unknown): CourseCategory[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const result: CourseCategory[] = [];
  for (const item of input) {
    if (!item || typeof item !== "object") continue;
    const raw = item as { id?: unknown; label?: unknown };
    const label = typeof raw.label === "string" ? raw.label.trim() : "";
    let id = typeof raw.id === "string" ? raw.id.trim() : "";
    if (!label) continue;
    if (!id) id = slugifyCategoryId(label);
    if (!isValidCategoryId(id) || seen.has(id)) continue;
    seen.add(id);
    result.push({ id, label });
  }
  return result;
}
