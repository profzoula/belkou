import type { RegistrationInput, RegistrationRecord } from "@/lib/schemas/registration";
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
  type RegistrationStats,
} from "@/server/supabase-registrations";

export type { RegistrationStats };

const devStore = new Map<string, RegistrationRecord>();

const INIT_SQL = `
CREATE TABLE IF NOT EXISTS registrations (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  country TEXT NOT NULL,
  level TEXT NOT NULL,
  plan TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  stripe_session_id TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_registrations_email ON registrations(email);
`;

export async function initDb(db: D1Database) {
  await db.exec(INIT_SQL);
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
  };
}

export async function saveRegistration(
  db: D1Database | null,
  data: RegistrationInput,
  options?: { payment_status?: RegistrationRecord["payment_status"] },
): Promise<RegistrationRecord> {
  const record: RegistrationRecord = {
    ...data,
    id: crypto.randomUUID(),
    payment_status: options?.payment_status ?? "pending",
    stripe_session_id: null,
    created_at: new Date().toISOString(),
  };

  if (db) {
    await initDb(db);
    await db
      .prepare(
        `INSERT INTO registrations (id, full_name, email, whatsapp, country, level, plan, payment_status, stripe_session_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        record.id,
        record.full_name,
        record.email,
        record.whatsapp,
        record.country,
        record.level,
        record.plan,
        record.payment_status,
        record.stripe_session_id,
        record.created_at,
      )
      .run();
    await supabaseSaveRegistration(record);
    return record;
  }

  await supabaseSaveRegistration(record);
  devStore.set(record.id, record);
  console.info("[BelKou dev] Registration saved:", record.id, record.email);
  return record;
}

export async function getRegistrationByEmail(
  db: D1Database | null,
  email: string,
): Promise<RegistrationRecord | null> {
  const normalized = email.trim().toLowerCase();

  if (db) {
    await initDb(db);
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
      .prepare(`UPDATE registrations SET plan = ?, payment_status = ? WHERE id = ?`)
      .bind(update.plan, update.payment_status, id)
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
      .prepare(`UPDATE registrations SET payment_status = ?, stripe_session_id = COALESCE(?, stripe_session_id) WHERE id = ?`)
      .bind(update.payment_status, update.stripe_session_id ?? null, id)
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
  const rows = await listRegistrations(db);
  return {
    total: rows.length,
    paid: rows.filter((r) => r.payment_status === "paid").length,
    pending: rows.filter((r) => r.payment_status === "pending").length,
    manual_pending: rows.filter((r) => r.payment_status === "manual_pending").length,
    premium: rows.filter((r) => r.plan === "premium").length,
    vip: rows.filter((r) => r.plan === "vip").length,
  };
}
