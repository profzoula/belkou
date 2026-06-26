import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { RegistrationInput, RegistrationRecord } from "@/lib/schemas/registration";
import { normalizeRegistrationEmail } from "@/lib/schemas/registration";
import { registrationCourseKey } from "@/lib/course-access";

let client: SupabaseClient | null | undefined;

export function getSupabaseAdmin(): SupabaseClient | null {
  if (client !== undefined) return client;

  const url =
    process.env.VITE_SUPABASE_URL ??
    process.env.SUPABASE_URL ??
    (typeof import.meta !== "undefined" ? import.meta.env?.VITE_SUPABASE_URL : undefined);
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    client = null;
    return null;
  }

  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

function rowToRecord(row: Record<string, unknown>): RegistrationRecord {
  return {
    id: String(row.id),
    full_name: String(row.full_name),
    email: String(row.email),
    whatsapp: String(row.whatsapp),
    country: String(row.country),
    level: String(row.level),
    plan: row.plan as RegistrationRecord["plan"],
    payment_status: row.payment_status as RegistrationRecord["payment_status"],
    course_slug: row.course_slug ? String(row.course_slug) : null,
    stripe_session_id: row.stripe_session_id ? String(row.stripe_session_id) : null,
    referral_code: row.referral_code ? String(row.referral_code) : null,
    created_at: String(row.created_at),
    updated_at: row.updated_at ? String(row.updated_at) : null,
  };
}

type RegistrationFields = Pick<
  RegistrationRecord,
  "full_name" | "email" | "whatsapp" | "country" | "level" | "plan" | "payment_status" | "course_slug"
>;

function baseFields(
  data: RegistrationInput,
  paymentStatus: RegistrationRecord["payment_status"],
): RegistrationFields {
  return {
    full_name: data.full_name,
    email: normalizeRegistrationEmail(data.email),
    whatsapp: data.whatsapp,
    country: data.country,
    level: data.level,
    plan: data.plan,
    payment_status: paymentStatus,
    course_slug: data.course_slug ?? null,
  };
}

async function supabaseUpdateFields(
  sb: SupabaseClient,
  id: string,
  fields: RegistrationFields,
): Promise<void> {
  for (const includeUpdatedAt of [true, false]) {
    const payload = includeUpdatedAt ? { ...fields, updated_at: new Date().toISOString() } : fields;
    const { error } = await sb.from("registrations").update(payload).eq("id", id);
    if (!error) return;
    if (!includeUpdatedAt || !error.message.includes("updated_at")) {
      throw error;
    }
  }
}

async function supabaseInsertFields(
  sb: SupabaseClient,
  fields: RegistrationFields,
): Promise<RegistrationRecord> {
  const id = crypto.randomUUID();
  for (const includeUpdatedAt of [true, false]) {
    const payload = includeUpdatedAt
      ? { id, ...fields, updated_at: new Date().toISOString() }
      : { id, ...fields };
    const { data, error } = await sb.from("registrations").insert(payload).select().single();
    if (!error && data) return rowToRecord(data as Record<string, unknown>);
    if (!includeUpdatedAt || !error?.message.includes("updated_at")) {
      throw error ?? new Error("Insert failed");
    }
  }
  throw new Error("Insert failed");
}

export async function supabaseSaveRegistration(
  data: RegistrationInput,
  options?: { payment_status?: RegistrationRecord["payment_status"] },
): Promise<RegistrationRecord> {
  const sb = getSupabaseAdmin();
  if (!sb) {
    const isProd = process.env.NODE_ENV === "production";
    if (isProd) {
      throw new Error("Base de données non configurée (SUPABASE_SERVICE_ROLE_KEY manquant).");
    }
    throw new Error("Supabase non configuré en local.");
  }

  const existing = await supabaseGetByEmailAndCourse(data.email, data.course_slug ?? null);
  const fields = baseFields(data, options?.payment_status ?? existing?.payment_status ?? "pending");

  try {
    if (existing) {
      await supabaseUpdateFields(sb, existing.id, fields);
      return { ...existing, ...fields };
    }
    return await supabaseInsertFields(sb, fields);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[BelKou] Supabase save registration:", message);
    throw new Error("Impossible d'enregistrer votre inscription. Réessayez ou contactez le support.");
  }
}

export async function supabaseUpdateRegistrationDetails(
  id: string,
  data: Pick<RegistrationRecord, "full_name" | "email" | "whatsapp" | "country" | "level" | "plan" | "course_slug">,
): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return;

  const existing = await supabaseGetById(id);
  const fields = baseFields(
    {
      full_name: data.full_name,
      email: data.email,
      whatsapp: data.whatsapp,
      country: data.country,
      level: data.level,
      plan: data.plan,
      course_slug: data.course_slug ?? undefined,
    },
    existing?.payment_status ?? "pending",
  );

  try {
    await supabaseUpdateFields(sb, id, fields);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[BelKou] Supabase update registration:", message);
    throw new Error("Impossible de mettre à jour votre inscription. Réessayez ou contactez le support.");
  }
}

export async function supabaseGetByEmail(email: string): Promise<RegistrationRecord | null> {
  const rows = await supabaseListByEmail(email);
  return rows[0] ?? null;
}

export async function supabaseListByEmail(email: string): Promise<RegistrationRecord[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];

  const normalized = normalizeRegistrationEmail(email);

  const { data, error } = await sb
    .from("registrations")
    .select("*")
    .ilike("email", normalized)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[BelKou] Supabase list by email:", error.message);
    return [];
  }

  return (data ?? []).map((row) => rowToRecord(row as Record<string, unknown>));
}

export async function supabaseGetByEmailAndCourse(
  email: string,
  courseSlug?: string | null,
): Promise<RegistrationRecord | null> {
  const key = registrationCourseKey(courseSlug);
  const rows = await supabaseListByEmail(email);
  return rows.find((row) => registrationCourseKey(row.course_slug) === key) ?? null;
}

export async function supabaseUpdateGrant(
  id: string,
  update: {
    plan: RegistrationRecord["plan"];
    payment_status: RegistrationRecord["payment_status"];
  },
): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return;

  const { error } = await sb
    .from("registrations")
    .update({ plan: update.plan, payment_status: update.payment_status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) console.error("[BelKou] Supabase update grant:", error.message);
}

export async function supabaseUpdateCourseAccess(
  id: string,
  update: {
    course_slug: string;
    payment_status: RegistrationRecord["payment_status"];
  },
): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return;

  const { error } = await sb
    .from("registrations")
    .update({
      course_slug: update.course_slug,
      payment_status: update.payment_status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) console.error("[BelKou] Supabase update course access:", error.message);
}

export async function supabaseUpdatePayment(
  id: string,
  update: { payment_status: RegistrationRecord["payment_status"]; stripe_session_id?: string | null },
): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return;

  const payload: Record<string, string | null> = { payment_status: update.payment_status, updated_at: new Date().toISOString() };
  if (update.stripe_session_id !== undefined) {
    payload.stripe_session_id = update.stripe_session_id;
  }

  const { error } = await sb.from("registrations").update(payload).eq("id", id);
  if (error) console.error("[BelKou] Supabase update payment:", error.message);
}

export async function supabaseSetStripeSessionId(id: string, sessionId: string): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return;

  const { error } = await sb.from("registrations").update({ stripe_session_id: sessionId }).eq("id", id);
  if (error) console.error("[BelKou] Supabase set session:", error.message);
}

export async function supabaseGetById(id: string): Promise<RegistrationRecord | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;

  const { data, error } = await sb.from("registrations").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return rowToRecord(data);
}

export async function supabaseGetByStripeSession(sessionId: string): Promise<RegistrationRecord | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;

  const { data, error } = await sb
    .from("registrations")
    .select("*")
    .eq("stripe_session_id", sessionId)
    .maybeSingle();
  if (error || !data) return null;
  return rowToRecord(data);
}

export async function supabaseGetCount(): Promise<number> {
  const sb = getSupabaseAdmin();
  if (!sb) return 0;

  const { count, error } = await sb.from("registrations").select("*", { count: "exact", head: true });
  if (error) return 0;
  return count ?? 0;
}

export async function supabaseListRegistrations(): Promise<RegistrationRecord[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];

  const { data, error } = await sb
    .from("registrations")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map((row) => rowToRecord(row));
}

export type RegistrationStats = {
  total: number;
  paid: number;
  pending: number;
  manual_pending: number;
  premium: number;
  vip: number;
};

export async function supabaseGetStats(): Promise<RegistrationStats | null> {
  const rows = await supabaseListRegistrations();
  if (!getSupabaseAdmin()) return null;

  return {
    total: rows.length,
    paid: rows.filter((r) => r.payment_status === "paid").length,
    pending: rows.filter((r) => r.payment_status === "pending").length,
    manual_pending: rows.filter((r) => r.payment_status === "manual_pending").length,
    premium: rows.filter((r) => r.plan === "premium").length,
    vip: rows.filter((r) => r.plan === "vip").length,
  };
}
