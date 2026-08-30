import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { hasPaidAccessToCourse, pickRegistrationForCourse } from "@/lib/course-access";
import { getExamEbookForCourse } from "@/lib/exam-ebooks";
import { normalizeRegistrationEmail } from "@/lib/schemas/registration";
import { siteConfig } from "@/lib/site-config";
import { getDb } from "@/server/env";
import { listRegistrationsByEmail } from "@/server/db";
import { createExamEbookAccessToken } from "@/server/exam-ebook-access";
import { getUserFromAccessToken } from "@/server/supabase-auth";

function isFounderEmail(email: string): boolean {
  const contact = siteConfig.contactEmail.trim().toLowerCase();
  return Boolean(contact) && email === contact;
}

export const getExamEbookAccess = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        courseSlug: z.string().min(1),
        accessToken: z.string().min(1),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const ebook = getExamEbookForCourse(data.courseSlug);
    if (!ebook) {
      throw new Error("Banque de questions introuvable");
    }

    const user = await getUserFromAccessToken(data.accessToken);
    if (!user?.email) {
      throw new Error("Connexion requise");
    }

    const email = normalizeRegistrationEmail(user.email);
    const db = await getDb();
    const { reconcilePendingCheckoutPaymentsForEmail } = await import("@/server/checkout-access");
    await reconcilePendingCheckoutPaymentsForEmail(db, email).catch(() => undefined);

    const rows = await listRegistrationsByEmail(db, email);
    const registration = pickRegistrationForCourse(rows, data.courseSlug);
    const paid = hasPaidAccessToCourse(registration, data.courseSlug);
    if (!paid && !isFounderEmail(email)) {
      throw new Error("Accès non autorisé — achetez ce cours pour ouvrir la banque.");
    }

    const token = createExamEbookAccessToken({
      courseSlug: data.courseSlug,
      email,
      ttlSeconds: 60 * 45,
    });

    return {
      title: ebook.title,
      url: `/api/exams/${encodeURIComponent(data.courseSlug)}?token=${encodeURIComponent(token)}`,
    };
  });
