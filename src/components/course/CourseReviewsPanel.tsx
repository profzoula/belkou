import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCount } from "@/lib/courses";
import { getCourseReviews, submitCourseReview } from "@/lib/fns/course-reviews";
import { cn } from "@/lib/utils";

type CourseReviewsPanelProps = {
  courseSlug: string;
  courseTitle: string;
  accessToken: string;
  fallbackRating: number;
  fallbackCount: number;
};

type PublicReview = {
  id: string;
  authorName: string;
  rating: number;
  text: string;
  createdAt: string;
};

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (rating: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          key={rating}
          type="button"
          className="rounded p-0.5 transition-colors hover:bg-muted"
          onClick={() => onChange(rating)}
          aria-label={`${rating} étoile${rating > 1 ? "s" : ""}`}
        >
          <Star
            className={cn(
              "h-5 w-5",
              rating <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground/50",
            )}
          />
        </button>
      ))}
    </div>
  );
}

export function CourseReviewsPanel({
  courseSlug,
  courseTitle,
  accessToken,
  fallbackRating,
  fallbackCount,
}: CourseReviewsPanelProps) {
  const loadReviewsFn = useServerFn(getCourseReviews);
  const submitReviewFn = useServerFn(submitCourseReview);
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [averageRating, setAverageRating] = useState(fallbackRating);
  const [count, setCount] = useState(fallbackCount);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    void loadReviewsFn({ data: { courseSlug } })
      .then((result) => {
        if (cancelled) return;
        setReviews(result.reviews);
        if (result.count > 0) {
          setAverageRating(result.averageRating);
          setCount(result.count);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [courseSlug, loadReviewsFn]);

  const submit = async () => {
    if (text.trim().length < 10) {
      toast.error("Écrivez au moins 10 caractères.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitReviewFn({
        data: {
          accessToken,
          courseSlug,
          rating,
          text: text.trim(),
        },
      });
      setReviews((current) => [result.review, ...current]);
      setAverageRating(result.averageRating);
      setCount(result.count);
      setText("");
      toast.success("Merci pour votre avis !");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Envoi impossible");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 text-left">
      <div>
        <h3 className="font-semibold text-foreground">Avis</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Partagez votre expérience sur <strong className="text-foreground">{courseTitle}</strong>.
        </p>
        <p className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-amber-600 dark:text-amber-400">
          {averageRating.toFixed(1)}
          <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
          <span className="font-normal text-muted-foreground">({formatCount(count)} avis)</span>
        </p>
      </div>

      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
        <p className="text-sm font-medium text-foreground">Laisser un avis</p>
        <div className="space-y-2">
          <Label>Note</Label>
          <StarPicker value={rating} onChange={setRating} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="review-text">Commentaire</Label>
          <Textarea
            id="review-text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Qu'avez-vous apprécié ? Qu'est-ce qui pourrait être amélioré ?"
            rows={4}
          />
        </div>
        <Button type="button" size="sm" onClick={submit} disabled={submitting}>
          {submitting ? "Envoi…" : "Publier mon avis"}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement des avis…
        </div>
      ) : reviews.length ? (
        <ul className="space-y-4">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-lg border border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-foreground">{review.authorName}</p>
                <p className="inline-flex items-center gap-1 text-xs text-amber-600">
                  {review.rating.toFixed(1)}
                  <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                </p>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{review.text}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Soyez le premier à laisser un avis sur ce cours.</p>
      )}
    </div>
  );
}
