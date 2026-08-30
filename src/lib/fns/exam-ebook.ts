import { createServerFn } from "@tanstack/react-start";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { hasPaidAccessToCourse, pickRegistrationForCourse } from "@/lib/course-access";
import { getExamEbookForCourse } from "@/lib/exam-ebooks";
import { normalizeRegistrationEmail } from "@/lib/schemas/registration";
import { getDb } from "@/server/env";
import { listRegistrationsByEmail } from "@/server/db";
import { getUserFromAccessToken } from "@/server/supabase-auth";

function examContentRoot(): string {
  return path.join(process.cwd(), "content", "exams");
}

export const getExamEbookHtml = createServerFn({ method: "POST" })
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

    const db = await getDb();
    const email = normalizeRegistrationEmail(user.email);
    const { reconcilePendingCheckoutPaymentsForEmail } = await import("@/server/checkout-access");
    await reconcilePendingCheckoutPaymentsForEmail(db, email).catch(() => undefined);

    const rows = await listRegistrationsByEmail(db, email);
    const registration = pickRegistrationForCourse(rows, data.courseSlug);
    if (!hasPaidAccessToCourse(registration, data.courseSlug)) {
      throw new Error("Accès non autorisé — achetez ce cours pour ouvrir la banque.");
    }

    const filePath = path.join(examContentRoot(), ebook.relativePath);
    const resolvedRoot = path.resolve(examContentRoot());
    const resolvedFile = path.resolve(filePath);
    if (!resolvedFile.startsWith(resolvedRoot + path.sep) && resolvedFile !== resolvedRoot) {
      throw new Error("Chemin invalide");
    }

    let html: string;
    try {
      html = await readFile(resolvedFile, "utf8");
    } catch {
      throw new Error("Fichier ebook introuvable sur le serveur");
    }

    return {
      title: ebook.title,
      html,
    };
  });
