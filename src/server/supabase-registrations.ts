import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { RegistrationRecord } from "@/lib/schemas/registration";

let client: SupabaseClient | null | undefined;

export function getSupabaseAdmin(): SupabaseClient | null {
  if (client !== undefined) return client;

  const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
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
    stripe_session_id: row.stripe_session_id ? String(row.stripe_session_id) : null,
    created_at: String(row.created_at),
    updated_at: row.updated_at ? String(row.updated_at) : null,
  };
}

export async function supabaseSaveRegistration(record: RegistrationRecord): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) {
    const isProd = process.env.NODE_ENV === "production";
    if (isProd) {
      throw new Error("Base de données non configurée (SUPABASE_SERVICE_ROLE_KEY manquant).");
    }
    console.warn("[BelKou] Supabase admin not configured — registration not persisted.");
    return;
  }

  const { error } = await sb.from("registrations").upsert({
    id: record.id,
    full_name: record.full_name,
    email: record.email,
    whatsapp: record.whatsapp,
    country: record.country,
    level: record.level,
    plan: record.plan,
    payment_status: record.payment_status,
    stripe_session_id: record.stripe_session_id,
    created_at: record.created_at,
    updated_at: record.updated_at ?? new Date().toISOString(),
  });

  if (error) {
    console.error("[BelKou] Supabase save registration:", error.message);
    throw new Error("Impossible d'enregistrer votre inscription. Réessayez ou contactez le support.");
  }
}

export async function supabaseUpdateRegistrationDetails(
  id: string,
  data: Pick<RegistrationRecord, "full_name" | "email" | "whatsapp" | "country" | "level" | "plan">,
): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return;

  const { error } = await sb
    .from("registrations")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) console.error("[BelKou] Supabase update registration:", error.message);
}

export async function supabaseGetByEmail(email: string): Promise<RegistrationRecord | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;

  const { data, error } = await sb
    .from("registrations")
    .select("*")
    .eq("email", email.trim().toLowerCase())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return rowToRecord(data);
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
