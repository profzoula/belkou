import type { RegistrationInput, RegistrationRecord } from "@/lib/schemas/registration";

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
): Promise<RegistrationRecord> {
  const record: RegistrationRecord = {
    ...data,
    id: crypto.randomUUID(),
    payment_status: "pending",
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
    return record;
  }

  devStore.set(record.id, record);
  console.info("[BelKou dev] Registration saved:", record.id, record.email);
  return record;
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
    return;
  }

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
    return row ? rowToRecord(row as Record<string, unknown>) : null;
  }
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
    return row ? rowToRecord(row as Record<string, unknown>) : null;
  }
  for (const record of devStore.values()) {
    if (record.stripe_session_id === sessionId) return record;
  }
  return null;
}

export async function setStripeSessionId(db: D1Database | null, id: string, sessionId: string) {
  if (db) {
    await db.prepare(`UPDATE registrations SET stripe_session_id = ? WHERE id = ?`).bind(sessionId, id).run();
    return;
  }
  const existing = devStore.get(id);
  if (existing) devStore.set(id, { ...existing, stripe_session_id: sessionId });
}

export async function getRegistrationCount(db: D1Database | null): Promise<number> {
  if (db) {
    await initDb(db);
    const row = await db.prepare(`SELECT COUNT(*) as total FROM registrations`).first<{ total: number }>();
    return row?.total ?? 0;
  }
  return devStore.size;
}
