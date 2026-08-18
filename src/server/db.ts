import type { RegistrationInput, RegistrationRecord } from "@/lib/schemas/registration";
import { normalizeRegistrationEmail } from "@/lib/schemas/registration";
import { registrationCourseKey, pickRegistrationForCourse } from "@/lib/course-access";
import {
  supabaseCountPaidForCourse,
  supabaseListPaidForCourse,
  supabaseGetById,
  supabaseGetByStripeSession,
  supabaseGetCount,
  supabaseGetStats,
  supabaseListByEmail,
  supabaseListRegistrations,
  supabaseSaveRegistration,
  supabaseSetStripeSessionId,
  supabaseUpdateGrant,
  supabaseUpdatePayment,
  supabaseUpdateCourseAccess,
  supabaseUpdateRegistrationDetails,
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
  course_slug TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  stripe_session_id TEXT,
  referral_code TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_registrations_email ON registrations(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_registrations_email_course ON registrations(email, COALESCE(course_slug, 'apps-ia-cursor-claude'));
`;

export async function initDb(db: D1Database) {
  await db.exec(INIT_SQL);
  // Older D1 databases may predate referral_code — add it idempotently.
  try {
    await db.exec(`ALTER TABLE registrations ADD COLUMN referral_code TEXT`);
  } catch {
    /* column already exists */
  }
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
    await supabaseUpdateRegistrationDetails(id, {
      full_name: normalized.full_name,
      email: normalized.email,
      whatsapp: normalized.whatsapp,
      country: normalized.country,
      level: normalized.level,
      plan: normalized.plan,
      course_slug: normalized.course_slug ?? null,
    });
    return getRegistrationById(db, id);
  }

  await supabaseUpdateRegistrationDetails(id, {
    full_name: normalized.full_name,
    email: normalized.email,
    whatsapp: normalized.whatsapp,
    country: normalized.country,
    level: normalized.level,
    plan: normalized.plan,
    course_slug: normalized.course_slug ?? null,
  });
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
    full_name: normalized.full_name,
    email: normalized.email,
    whatsapp: normalized.whatsapp,
    country: normalized.country,
    level: normalized.level,
    plan: normalized.plan,
    course_slug: normalized.course_slug ?? null,
    id: crypto.randomUUID(),
    payment_status: options?.payment_status ?? "pending",
    stripe_session_id: null,
    referral_code: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (!db) {
    const saved = await supabaseSaveRegistration(normalized, options);
    devStore.set(saved.id, saved);
    return saved;
  }

  await initDb(db);

  // Supabase is the source of truth for Stripe/affiliates — create/reuse that id first,
  // then mirror the exact same primary key into D1 (prevents dual-UUID drift).
  try {
    const saved = await supabaseSaveRegistration(normalized, {
      ...options,
      id: record.id,
    });
    await db
      .prepare(
        `INSERT INTO registrations (id, full_name, email, whatsapp, country, level, plan, course_slug, payment_status, stripe_session_id, referral_code, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           full_name = excluded.full_name,
           email = excluded.email,
           whatsapp = excluded.whatsapp,
           country = excluded.country,
           level = excluded.level,
           plan = excluded.plan,
           course_slug = excluded.course_slug,
           payment_status = excluded.payment_status,
           updated_at = excluded.updated_at`,
      )
      .bind(
        saved.id,
        saved.full_name,
        saved.email,
        saved.whatsapp,
        saved.country,
        saved.level,
        saved.plan,
        saved.course_slug,
        saved.payment_status,
        saved.stripe_session_id,
        saved.referral_code,
        saved.created_at,
        saved.updated_at ?? saved.created_at,
      )
      .run();
    devStore.set(saved.id, saved);
    return saved;
  } catch (error) {
    console.warn("[BelKou] Supabase save failed; writing D1-only fallback:", error);
    await db
      .prepare(
        `INSERT INTO registrations (id, full_name, email, whatsapp, country, level, plan, course_slug, payment_status, stripe_session_id, referral_code, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        record.referral_code,
        record.created_at,
        record.updated_at,
      )
      .run();
    devStore.set(record.id, record);
    return record;
  }
}

function paymentRank(status: RegistrationRecord["payment_status"]): number {
  if (status === "paid") return 2;
  if (status === "manual_pending") return 1;
  return 0;
}

/** Prefer paid (then freshest) when D1 and Supabase disagree. */
function preferRegistration(a: RegistrationRecord, b: RegistrationRecord): RegistrationRecord {
  const rankDiff = paymentRank(a.payment_status) - paymentRank(b.payment_status);
  if (rankDiff !== 0) return rankDiff > 0 ? a : b;
  const aTime = Date.parse(a.updated_at ?? a.created_at);
  const bTime = Date.parse(b.updated_at ?? b.created_at);
  return aTime >= bTime ? a : b;
}

function mergeRegistrationRows(rows: RegistrationRecord[]): RegistrationRecord[] {
  const byId = new Map<string, RegistrationRecord>();
  for (const row of rows) {
    const existing = byId.get(row.id);
    byId.set(row.id, existing ? preferRegistration(existing, row) : row);
  }

  // One row per email+course — avoids a stale D1 pending hiding a paid Supabase row.
  const byCourse = new Map<string, RegistrationRecord>();
  for (const row of byId.values()) {
    const key = `${normalizeRegistrationEmail(row.email)}::${registrationCourseKey(row.course_slug)}`;
    const existing = byCourse.get(key);
    byCourse.set(key, existing ? preferRegistration(existing, row) : row);
  }

  return [...byCourse.values()].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}

export async function listRegistrationsByEmail(
  db: D1Database | null,
  email: string,
): Promise<RegistrationRecord[]> {
  const normalized = normalizeRegistrationEmail(email);
  const collected: RegistrationRecord[] = [];

  if (db) {
    const { results } = await db
      .prepare(`SELECT * FROM registrations WHERE lower(email) = ? ORDER BY created_at DESC`)
      .bind(normalized)
      .all<Record<string, unknown>>();
    if (results?.length) collected.push(...results.map(rowToRecord));
  }

  const fromSb = await supabaseListByEmail(normalized);
  if (fromSb.length) collected.push(...fromSb);

  if (!collected.length) {
    return [...devStore.values()]
      .filter((record) => record.email.toLowerCase() === normalized)
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  }

  const merged = mergeRegistrationRows(collected);

  // Heal D1 when Supabase (or merge) says paid but a same-id D1 row is still pending.
  if (db) {
    for (const row of merged) {
      if (row.payment_status !== "paid") continue;
      const d1Pending = collected.find((r) => r.id === row.id && r.payment_status !== "paid");
      if (!d1Pending) continue;
      try {
        await db
          .prepare(
            `UPDATE registrations SET payment_status = ?, stripe_session_id = COALESCE(?, stripe_session_id), updated_at = ? WHERE id = ?`,
          )
          .bind(row.payment_status, row.stripe_session_id, new Date().toISOString(), row.id)
          .run();
      } catch (error) {
        console.warn("[BelKou] D1 payment heal failed:", error);
      }
    }
  }

  return merged;
}

export async function getRegistrationByEmailAndCourse(
  db: D1Database | null,
  email: string,
  courseSlug?: string | null,
): Promise<RegistrationRecord | null> {
  const rows = await listRegistrationsByEmail(db, email);
  return pickRegistrationForCourse(rows, registrationCourseKey(courseSlug));
}

export async function getRegistrationByEmail(
  db: D1Database | null,
  email: string,
): Promise<RegistrationRecord | null> {
  const rows = await listRegistrationsByEmail(db, email);
  return rows[0] ?? null;
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

export async function updateRegistrationCourseAccess(
  db: D1Database | null,
  id: string,
  update: {
    course_slug: string;
    payment_status: RegistrationRecord["payment_status"];
  },
): Promise<RegistrationRecord | null> {
  const updatedAt = new Date().toISOString();

  if (db) {
    await db
      .prepare(
        `UPDATE registrations SET course_slug = ?, payment_status = ?, updated_at = ? WHERE id = ?`,
      )
      .bind(update.course_slug, update.payment_status, updatedAt, id)
      .run();
    await supabaseUpdateCourseAccess(id, update);
    return getRegistrationById(db, id);
  }

  await supabaseUpdateCourseAccess(id, update);
  const existing = devStore.get(id);
  if (existing) {
    const next = {
      ...existing,
      course_slug: update.course_slug,
      payment_status: update.payment_status,
      updated_at: updatedAt,
    };
    devStore.set(id, next);
    return next;
  }

  return supabaseGetById(id);
}

export async function updateRegistrationPayment(
  db: D1Database | null,
  id: string,
  update: {
    payment_status: RegistrationRecord["payment_status"];
    stripe_session_id?: string | null;
  },
) {
  // Supabase first — student access / admin prefer it when D1 lags or diverges.
  await supabaseUpdatePayment(id, update);

  if (db) {
    await db
      .prepare(
        `UPDATE registrations SET payment_status = ?, stripe_session_id = COALESCE(?, stripe_session_id), updated_at = ? WHERE id = ?`,
      )
      .bind(update.payment_status, update.stripe_session_id ?? null, new Date().toISOString(), id)
      .run();
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

export async function getRegistrationById(
  db: D1Database | null,
  id: string,
): Promise<RegistrationRecord | null> {
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
    return row
      ? rowToRecord(row as Record<string, unknown>)
      : await supabaseGetByStripeSession(sessionId);
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
    await db
      .prepare(`UPDATE registrations SET stripe_session_id = ? WHERE id = ?`)
      .bind(sessionId, id)
      .run();
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
    const row = await db
      .prepare(`SELECT COUNT(*) as total FROM registrations`)
      .first<{ total: number }>();
    return row?.total ?? (await supabaseGetCount());
  }
  const sbCount = await supabaseGetCount();
  if (sbCount > 0) return sbCount;
  return devStore.size;
}

export async function listRegistrations(db: D1Database | null): Promise<RegistrationRecord[]> {
  // Prefer Supabase (payment/affiliate source of truth) when available.
  const fromSb = await supabaseListRegistrations();
  if (fromSb.length > 0) return fromSb;

  if (db) {
    await initDb(db);
    const { results } = await db
      .prepare(`SELECT * FROM registrations ORDER BY created_at DESC`)
      .all<Record<string, unknown>>();
    return (results ?? []).map(rowToRecord);
  }

  return [...devStore.values()].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

/** Everyone who paid for one slug, de-duplicated across both stores. */
export async function listPaidRegistrationsForCourse(
  db: D1Database | null,
  courseSlug: string,
): Promise<RegistrationRecord[]> {
  const collected: RegistrationRecord[] = [];

  if (db) {
    try {
      const { results } = await db
        .prepare(
          `SELECT * FROM registrations WHERE course_slug = ? AND payment_status = 'paid' ORDER BY created_at DESC`,
        )
        .bind(courseSlug)
        .all<Record<string, unknown>>();
      if (results?.length) collected.push(...results.map(rowToRecord));
    } catch {
      /* D1 unavailable — Supabase still answers below */
    }
  }

  collected.push(...(await supabaseListPaidForCourse(courseSlug)));

  if (!collected.length) {
    return [...devStore.values()].filter(
      (record) => record.course_slug === courseSlug && record.payment_status === "paid",
    );
  }

  const byEmail = new Map<string, RegistrationRecord>();
  for (const record of collected) {
    const key = normalizeRegistrationEmail(record.email);
    if (!byEmail.has(key)) byEmail.set(key, record);
  }
  return [...byEmail.values()];
}

/**
 * Paid seats for one slug. Both stores are asked and the larger wins, since a row
 * can exist in one and not yet in the other.
 */
export async function countPaidRegistrationsForCourse(
  db: D1Database | null,
  courseSlug: string,
): Promise<number> {
  let d1Count = 0;
  if (db) {
    try {
      const row = await db
        .prepare(
          `SELECT COUNT(*) as total FROM registrations WHERE course_slug = ? AND payment_status = 'paid'`,
        )
        .bind(courseSlug)
        .first<{ total: number }>();
      d1Count = row?.total ?? 0;
    } catch {
      d1Count = 0;
    }
  }
  const sbCount = await supabaseCountPaidForCourse(courseSlug);
  return Math.max(d1Count, sbCount);
}

export async function getRegistrationStats(db: D1Database | null): Promise<RegistrationStats> {
  const fromSb = await supabaseGetStats();
  if (fromSb && fromSb.total > 0) return fromSb;

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

  return fromSb ?? { total: 0, paid: 0, pending: 0, manual_pending: 0, premium: 0, vip: 0 };
}
