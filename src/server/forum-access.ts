import type { User } from "@supabase/supabase-js";
import { hasPaidAccessToCourse, pickRegistrationForCourse } from "@/lib/course-access";
import { normalizeRegistrationEmail } from "@/lib/schemas/registration";
import { getDb } from "@/server/env";
import { listRegistrationsByEmail } from "@/server/db";
import { getUserFromAccessToken } from "@/server/supabase-auth";
import { getResolvedCourseBySlug } from "@/server/site-content";

export type ForumActor = {
  userId: string;
  email: string;
  name: string;
};

export function displayNameFromUser(user: User): string {
  const meta = user.user_metadata ?? {};
  const fromMeta =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    "";
  if (fromMeta.trim()) return fromMeta.trim();
  return user.email?.split("@")[0] ?? "Étudiant";
}

export async function assertForumAccess(
  accessToken: string,
  courseSlug: string,
): Promise<{ actor: ForumActor; courseTitle: string }> {
  const user = await getUserFromAccessToken(accessToken);
  if (!user?.email || !user.id) {
    throw new Error("Connexion requise.");
  }

  const course = await getResolvedCourseBySlug(courseSlug);
  if (!course) {
    throw new Error("Cours introuvable.");
  }

  const db = await getDb();
  const email = normalizeRegistrationEmail(user.email);
  const rows = await listRegistrationsByEmail(db, email);
  const registration = pickRegistrationForCourse(rows, courseSlug);

  if (!hasPaidAccessToCourse(registration, courseSlug)) {
    throw new Error("Le forum est réservé aux étudiants inscrits à ce cours.");
  }

  return {
    actor: {
      userId: user.id,
      email,
      name: displayNameFromUser(user),
    },
    courseTitle: course.title,
  };
}
