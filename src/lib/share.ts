import { toast } from "sonner";

/**
 * Native share sheet where the browser offers one, clipboard everywhere else.
 * A cancelled share sheet is a normal outcome, not an error worth reporting.
 */
export async function shareLink(params: { title: string; text?: string; url: string }) {
  try {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share(params);
      return;
    }
    await navigator.clipboard.writeText(params.url);
    toast.success("Lien copié.");
  } catch {
    /* the reader closed the share sheet */
  }
}
