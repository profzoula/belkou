/**
 * Canonical course categories shown on the homepage and assignable in admin.
 */
export const COURSE_CATEGORIES = [
  { id: "dropshipping", label: "Dropshipping" },
  { id: "developpement-app", label: "Développement App" },
  { id: "marketing-digital", label: "Marketing Digital" },
  { id: "shopify-shop", label: "Shopify Shop" },
  { id: "facebook-ads", label: "Facebook Ads" },
  { id: "powershell-cmd", label: "Powershell & CMD" },
  { id: "ebook", label: "Ebook" },
] as const;

export type CourseCategoryId = (typeof COURSE_CATEGORIES)[number]["id"];

const categoryIdSet = new Set<string>(COURSE_CATEGORIES.map((c) => c.id));

export function isCourseCategoryId(value: string): value is CourseCategoryId {
  return categoryIdSet.has(value);
}

export function normalizeCourseCategories(values: unknown): CourseCategoryId[] {
  if (!Array.isArray(values)) return [];
  const seen = new Set<CourseCategoryId>();
  const result: CourseCategoryId[] = [];
  for (const value of values) {
    if (typeof value !== "string") continue;
    const id = value.trim();
    if (!isCourseCategoryId(id) || seen.has(id)) continue;
    seen.add(id);
    result.push(id);
  }
  return result;
}

export function getCourseCategoryLabel(id: string): string {
  return COURSE_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}
