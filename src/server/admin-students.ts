import type { User } from "@supabase/supabase-js";
import { normalizeRegistrationEmail } from "@/lib/schemas/registration";
import type { RegistrationRecord } from "@/lib/schemas/registration";
import { getDb } from "@/server/env";
import {
  getRegistrationByEmail,
  listRegistrations,
  saveRegistration,
  updateRegistrationCourseAccess,
} from "@/server/db";
import { getSupabaseAdmin } from "@/server/supabase-registrations";
import { getResolvedCourseBySlug } from "@/server/site-content";

export type AdminStudentRow = {
  userId: string;
  email: string;
  fullName: string;
  createdAt: string;
  lastSignInAt: string | null;
  registrationId: string | null;
  paymentStatus: RegistrationRecord["payment_status"] | null;
  courseSlug: string | null;
};

function displayNameFromUser(user: User): string {
  const meta = user.user_metadata ?? {};
  const fromMeta =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    "";
  if (fromMeta.trim()) return fromMeta.trim();
  return user.email?.split("@")[0] ?? "Étudiant";
}

export async function listAdminStudents(): Promise<AdminStudentRow[]> {
  const db = await getDb();
  const registrations = await listRegistrations(db);
  const regByEmail = new Map(registrations.map((r) => [normalizeRegistrationEmail(r.email), r]));

  const sb = getSupabaseAdmin();
  if (!sb) {
    return registrations.map((r) => ({
      userId: "",
      email: r.email,
      fullName: r.full_name,
      createdAt: r.created_at,
      lastSignInAt: null,
      registrationId: r.id,
      paymentStatus: r.payment_status,
      courseSlug: r.course_slug,
    }));
  }

  const users: User[] = [];
  let page = 1;

  while (page <= 25) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 200 });
    if (error) {
      console.error("[BelKou] list auth users:", error.message);
      break;
    }
    if (!data.users.length) break;
    users.push(...data.users);
    if (data.users.length < 200) break;
    page++;
  }

  return users
    .filter((user) => Boolean(user.email))
    .map((user) => {
      const email = normalizeRegistrationEmail(user.email!);
      const reg = regByEmail.get(email);
      return {
        userId: user.id,
        email: user.email!,
        fullName: displayNameFromUser(user),
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at ?? null,
        registrationId: reg?.id ?? null,
        paymentStatus: reg?.payment_status ?? null,
        courseSlug: reg?.course_slug ?? null,
      };
    })
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export async function grantCourseAccessToStudent(params: {
  email: string;
  courseSlug: string;
  fullName?: string;
}): Promise<RegistrationRecord> {
  const course = await getResolvedCourseBySlug(params.courseSlug);
  if (!course) {
    throw new Error("Cours introuvable");
  }

  const db = await getDb();
  const email = normalizeRegistrationEmail(params.email);
  const existing = await getRegistrationByEmail(db, email);

  if (existing) {
    const updated = await updateRegistrationCourseAccess(db, existing.id, {
      course_slug: params.courseSlug,
      payment_status: "paid",
    });
    if (!updated) {
      throw new Error("Mise à jour impossible");
    }
    return updated;
  }

  const sb = getSupabaseAdmin();
  let fullName = params.fullName?.trim() || email.split("@")[0] || "Étudiant";

  if (sb) {
    let page = 1;
    while (page <= 10) {
      const { data } = await sb.auth.admin.listUsers({ page, perPage: 200 });
      if (!data?.users.length) break;
      const match = data.users.find((u) => u.email && normalizeRegistrationEmail(u.email) === email);
      if (match) {
        fullName = displayNameFromUser(match);
        break;
      }
      if (data.users.length < 200) break;
      page++;
    }
  }

  return saveRegistration(
    db,
    {
      full_name: fullName,
      email,
      whatsapp: "—",
      country: "HT",
      level: "beginner",
      plan: "premium",
      course_slug: params.courseSlug,
    },
    { payment_status: "paid" },
  );
}
