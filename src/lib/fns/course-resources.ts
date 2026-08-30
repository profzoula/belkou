import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { hasPaidAccessToCourse, pickRegistrationForCourse } from "@/lib/course-access";
import { resolveResourceStoragePath } from "@/lib/course-resources";
import { normalizeRegistrationEmail } from "@/lib/schemas/registration";
import { createSignedCourseResourceUrl } from "@/server/course-resource-storage";
import { getDb } from "@/server/env";
import { listRegistrationsByEmail } from "@/server/db";
import { getResolvedCourseBySlug } from "@/server/site-content";
import { getUserFromAccessToken } from "@/server/supabase-auth";

export const getCourseResourceDownloadUrl = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        courseSlug: z.string().min(1),
        resourceId: z.string().min(1),
        accessToken: z.string().min(1),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
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
      throw new Error("Accès non autorisé");
    }

    const course = await getResolvedCourseBySlug(data.courseSlug);
    if (!course) {
      throw new Error("Cours introuvable");
    }

    const resource = course.resources?.find((item) => item.id === data.resourceId);
    if (!resource) {
      throw new Error("Ressource introuvable");
    }

    const storagePath = resolveResourceStoragePath(resource);
    if (!storagePath) {
      throw new Error("Fichier introuvable");
    }

    const signed = await createSignedCourseResourceUrl(storagePath);
    if (!signed.ok) {
      throw new Error(signed.reason);
    }

    return {
      url: signed.url,
      fileName: resource.fileName,
    };
  });
