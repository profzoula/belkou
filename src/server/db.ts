import type { RegistrationInput, RegistrationRecord } from "@/lib/schemas/registration";
import { normalizeRegistrationEmail } from "@/lib/schemas/registration";
import {
  supabaseGetByEmail,
  supabaseGetById,
  supabaseGetByStripeSession,
  supabaseGetCount,
  supabaseGetStats,
  supabaseListRegistrations,
  supabaseSaveRegistration,
  supabaseSetStripeSessionId,
  supabaseUpdateGrant,
  supabaseUpdatePayment,
  supabaseUpdateRegistrationDetails,
  type RegistrationStats,
} from "@/server/supabase-registrations";

export type { RegistrationStats };

const devStore = new Map<string, RegistrationRecord>();

const INIT_SQL = `
CREATE TABLE IF NOT EXISTS registrations (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  whatsapp TEXT NOT NULL,
  country TEXT NOT NULL,
  level TEXT NOT NULL,
  plan TEXT NOT NULL,
  course_slug TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  stripe_session_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_registrations_email ON registrations(email);
`;

export async function initDb(db: D1Database) {
  await db.exec(INIT_SQL);
}

export function rowToRecord(row: Record<string, unknown>): RegistrationRecord {
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

export async function updateRegistrationDetails(
  db: D1Database | null,
  id: string,
  data: RegistrationInput,
): Promise<RegistrationRecord | null> {
  const normalized: RegistrationInput = {
    ...data,
    email: normalizeRegistrationEmail(data.email),
  };
  const updatedAt = new Date().toISOString();

  if (db) {
    await db
      .prepare(
        `UPDATE registrations SET full_name = ?, email = ?, whatsapp = ?, country = ?, level = ?, plan = ?, course_slug = ?, updated_at = ? WHERE id = ?`,
      )
      .bind(
        normalized.full_name,
        normalized.email,
        normalized.whatsapp,
        normalized.country,
        normalized.level,
        normalized.plan,
        normalized.course_slug ?? null,
        updatedAt,
        id,
      )
      .run();
    await supabaseUpdateRegistrationDetails(id, normalized);
    return getRegistrationById(db, id);
  }

  await supabaseUpdateRegistrationDetails(id, normalized);
  const existing = devStore.get(id);
  if (existing) {
    const next = { ...existing, ...normalized, updated_at: updatedAt };
    devStore.set(id, next);
    return next;
  }

  return supabaseGetById(id);
}

export async function saveRegistration(
  db: D1Database | null,
  data: RegistrationInput,
  options?: { payment_status?: RegistrationRecord["payment_status"] },
): Promise<RegistrationRecord> {
  const normalized: RegistrationInput = {
    ...data,
    email: normalizeRegistrationEmail(data.email),
  };
  const record: RegistrationRecord = {
    ...normalized,
    id: crypto.randomUUID(),
    payment_status: options?.payment_status ?? "pending",
    stripe_session_id: null,
    referral_code: null,
    course_slug: normalized.course_slug ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (!db) {
    const saved = await supabaseSaveRegistration(normalized, options);
    devStore.set(saved.id, saved);
    return saved;
  }

  await initDb(db);
  await db
    .prepare(
      `INSERT INTO registrations (id, full_name, email, whatsapp, country, level, plan, course_slug, payment_status, stripe_session_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      record.id,
      record.full_name,
      record.email,
      record.whatsapp,
      record.country,
      record.level,
      record.plan,
      record.course_slug,
      record.payment_status,
      record.stripe_session_id,
      record.created_at,
      record.updated_at,
    )
    .run();

  try {
    const saved = await supabaseSaveRegistration(normalized, options);
    devStore.set(saved.id, saved);
    return saved;
  } catch (error) {
    console.warn("[BelKou] Supabase sync failed (D1 saved):", error);
    devStore.set(record.id, record);
    return record;
  }
}

export async function getRegistrationByEmail(
  db: D1Database | null,
  email: string,
): Promise<RegistrationRecord | null> {
  const normalized = normalizeRegistrationEmail(email);

  if (db) {
    const row = await db
      .prepare(`SELECT * FROM registrations WHERE lower(email) = ? ORDER BY created_at DESC LIMIT 1`)
      .bind(normalized)
      .first();
    if (row) return rowToRecord(row as Record<string, unknown>);
  }

  const fromSb = await supabaseGetByEmail(normalized);
  if (fromSb) return fromSb;

  for (const record of devStore.values()) {
    if (record.email.toLowerCase() === normalized) return record;
  }
  return null;
}

export async function updateRegistrationGrant(
  db: D1Database | null,
  id: string,
  update: {
    plan: RegistrationRecord["plan"];
    payment_status: RegistrationRecord["payment_status"];
  },
): Promise<RegistrationRecord | null> {
  if (db) {
    await db
      .prepare(`UPDATE registrations SET plan = ?, payment_status = ?, updated_at = ? WHERE id = ?`)
      .bind(update.plan, update.payment_status, new Date().toISOString(), id)
      .run();
    await supabaseUpdateGrant(id, update);
    return getRegistrationById(db, id);
  }

  await supabaseUpdateGrant(id, update);
  const existing = devStore.get(id);
  if (existing) {
    const next = { ...existing, plan: update.plan, payment_status: update.payment_status };
    devStore.set(id, next);
    return next;
  }

  return supabaseGetById(id);
}

export async function updateRegistrationPayment(
  db: D1Database | null,
  id: string,
  update: { payment_status: RegistrationRecord["payment_status"]; stripe_session_id?: string | null },
) {
  if (db) {
    await db
      .prepare(`UPDATE registrations SET payment_status = ?, stripe_session_id = COALESCE(?, stripe_session_id), updated_at = ? WHERE id = ?`)
      .bind(update.payment_status, update.stripe_session_id ?? null, new Date().toISOString(), id)
      .run();
    await supabaseUpdatePayment(id, update);
    return;
  }

  await supabaseUpdatePayment(id, update);
  const existing = devStore.get(id);
  if (existing) {
    devStore.set(id, {
      ...existing,
      payment_status: update.payment_status,
      stripe_session_id: update.stripe_session_id ?? existing.stripe_session_id,
    });
  }
}

export async function getRegistrationById(db: D1Database | null, id: string): Promise<RegistrationRecord | null> {
  if (db) {
    const row = await db.prepare(`SELECT * FROM registrations WHERE id = ?`).bind(id).first();
    return row ? rowToRecord(row as Record<string, unknown>) : await supabaseGetById(id);
  }
  const fromSb = await supabaseGetById(id);
  if (fromSb) return fromSb;
  return devStore.get(id) ?? null;
}

export async function getRegistrationByStripeSession(
  db: D1Database | null,
  sessionId: string,
): Promise<RegistrationRecord | null> {
  if (db) {
    const row = await db
      .prepare(`SELECT * FROM registrations WHERE stripe_session_id = ?`)
      .bind(sessionId)
      .first();
    return row ? rowToRecord(row as Record<string, unknown>) : await supabaseGetByStripeSession(sessionId);
  }
  const fromSb = await supabaseGetByStripeSession(sessionId);
  if (fromSb) return fromSb;
  for (const record of devStore.values()) {
    if (record.stripe_session_id === sessionId) return record;
  }
  return null;
}

export async function setStripeSessionId(db: D1Database | null, id: string, sessionId: string) {
  if (db) {
    await db.prepare(`UPDATE registrations SET stripe_session_id = ? WHERE id = ?`).bind(sessionId, id).run();
    await supabaseSetStripeSessionId(id, sessionId);
    return;
  }
  await supabaseSetStripeSessionId(id, sessionId);
  const existing = devStore.get(id);
  if (existing) devStore.set(id, { ...existing, stripe_session_id: sessionId });
}

export async function getRegistrationCount(db: D1Database | null): Promise<number> {
  if (db) {
    await initDb(db);
    const row = await db.prepare(`SELECT COUNT(*) as total FROM registrations`).first<{ total: number }>();
    return row?.total ?? (await supabaseGetCount());
  }
  const sbCount = await supabaseGetCount();
  if (sbCount > 0) return sbCount;
  return devStore.size;
}

export async function listRegistrations(db: D1Database | null): Promise<RegistrationRecord[]> {
  if (db) {
    await initDb(db);
    const { results } = await db
      .prepare(`SELECT * FROM registrations ORDER BY created_at DESC`)
      .all<Record<string, unknown>>();
    return (results ?? []).map(rowToRecord);
  }

  const fromSb = await supabaseListRegistrations();
  if (fromSb.length > 0) return fromSb;

  return [...devStore.values()].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export async function getRegistrationStats(db: D1Database | null): Promise<RegistrationStats> {
  if (db) {
    await initDb(db);
    const row = await db
      .prepare(
        `SELECT
          COUNT(*) as total,
          SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) as paid,
          SUM(CASE WHEN payment_status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN payment_status = 'manual_pending' THEN 1 ELSE 0 END) as manual_pending,
          SUM(CASE WHEN plan = 'premium' THEN 1 ELSE 0 END) as premium,
          SUM(CASE WHEN plan = 'vip' THEN 1 ELSE 0 END) as vip
        FROM registrations`,
      )
      .first<Record<string, number>>();

    if (row) {
      return {
        total: row.total ?? 0,
        paid: row.paid ?? 0,
        pending: row.pending ?? 0,
        manual_pending: row.manual_pending ?? 0,
        premium: row.premium ?? 0,
        vip: row.vip ?? 0,
      };
    }
  }

  return (await supabaseGetStats()) ?? { total: 0, paid: 0, pending: 0, manual_pending: 0, premium: 0, vip: 0 };
}
