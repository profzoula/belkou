import { getSupabaseAdmin } from "@/server/supabase-registrations";

const COURSE_REVIEWS_KEY = "course_reviews";

export type CourseReview = {
  id: string;
  courseSlug: string;
  authorEmail: string;
  authorName: string;
  rating: number;
  text: string;
  createdAt: string;
};

type CourseReviewsStore = Record<string, CourseReview[]>;

async function readReviewsStore(): Promise<CourseReviewsStore> {
  const sb = getSupabaseAdmin();
  if (!sb) return {};

  const { data, error } = await sb.from("site_content").select("value").eq("key", COURSE_REVIEWS_KEY).maybeSingle();
  if (error || !data?.value) return {};
  return (data.value as CourseReviewsStore) ?? {};
}

async function writeReviewsStore(store: CourseReviewsStore): Promise<{ ok: boolean; reason?: string }> {
  const sb = getSupabaseAdmin();
  if (!sb) {
    return { ok: false, reason: "Supabase non configuré" };
  }

  const { error } = await sb.from("site_content").upsert(
    {
      key: COURSE_REVIEWS_KEY,
      value: store,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );

  if (error) {
    return { ok: false, reason: error.message };
  }

  return { ok: true };
}

export async function listCourseReviews(courseSlug: string): Promise<CourseReview[]> {
  const store = await readReviewsStore();
  return (store[courseSlug] ?? []).slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function addCourseReview(params: {
  courseSlug: string;
  authorName: string;
  authorEmail: string;
  rating: number;
  text: string;
}): Promise<{ ok: true; review: CourseReview } | { ok: false; reason: string }> {
  const text = params.text.trim();
  if (text.length < 10) {
    return { ok: false, reason: "L'avis doit contenir au moins 10 caractères." };
  }

  const store = await readReviewsStore();
  const existing = store[params.courseSlug] ?? [];
  const email = params.authorEmail.trim().toLowerCase();

  if (existing.some((review) => review.authorEmail === email)) {
    return { ok: false, reason: "Vous avez déjà laissé un avis pour ce cours." };
  }

  const review: CourseReview = {
    id: crypto.randomUUID(),
    courseSlug: params.courseSlug,
    authorEmail: email,
    authorName: params.authorName.trim() || "Étudiant BelKou",
    rating: params.rating,
    text,
    createdAt: new Date().toISOString(),
  };

  store[params.courseSlug] = [review, ...existing];
  const saved = await writeReviewsStore(store);
  if (!saved.ok) {
    return { ok: false, reason: saved.reason ?? "Enregistrement impossible" };
  }

  return { ok: true, review };
}

export function summarizeCourseReviews(reviews: CourseReview[]): {
  averageRating: number;
  count: number;
} {
  if (!reviews.length) {
    return { averageRating: 0, count: 0 };
  }

  const sum = reviews.reduce((total, review) => total + review.rating, 0);
  return {
    averageRating: Math.round((sum / reviews.length) * 10) / 10,
    count: reviews.length,
  };
}
