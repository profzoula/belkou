import { getSupabaseAdmin } from "@/server/supabase-registrations";

const D1_WEBHOOK_EVENTS_SQL = `
CREATE TABLE IF NOT EXISTS checkout_webhook_events (
  event_id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;

async function beginWebhookEventD1(
  db: D1Database,
  eventId: string,
): Promise<"process" | "duplicate"> {
  await db.exec(D1_WEBHOOK_EVENTS_SQL);

  const existing = await db
    .prepare(`SELECT status FROM checkout_webhook_events WHERE event_id = ?`)
    .bind(eventId)
    .first<{ status?: string | null }>();
  if (existing?.status === "success") return "duplicate";

  await db
    .prepare(
      `INSERT INTO checkout_webhook_events (event_id, status, updated_at)
       VALUES (?, 'processing', ?)
       ON CONFLICT(event_id) DO UPDATE SET status = 'processing', updated_at = excluded.updated_at`,
    )
    .bind(eventId, new Date().toISOString())
    .run();
  return "process";
}

async function finishWebhookEventD1(db: D1Database, eventId: string): Promise<void> {
  await db
    .prepare(
      `UPDATE checkout_webhook_events SET status = 'success', updated_at = ? WHERE event_id = ?`,
    )
    .bind(new Date().toISOString(), eventId)
    .run();
}

async function beginWebhookEventSupabase(eventId: string): Promise<"process" | "duplicate"> {
  const sb = getSupabaseAdmin();
  if (!sb) {
    throw new Error("Supabase admin client unavailable for webhook idempotency");
  }

  // Prefer new table; fall back to legacy stripe_webhook_events if migration not applied yet.
  for (const table of ["checkout_webhook_events", "stripe_webhook_events"] as const) {
    const existing = await sb.from(table).select("status").eq("event_id", eventId).maybeSingle();
    if (existing.error) {
      if (table === "checkout_webhook_events") continue;
      throw new Error(existing.error.message);
    }
    if (existing.data?.status === "success") return "duplicate";

    const now = new Date().toISOString();
    const upsert = await sb.from(table).upsert(
      {
        event_id: eventId,
        status: "processing",
        updated_at: now,
      },
      { onConflict: "event_id" },
    );

    if (upsert.error) {
      if (table === "checkout_webhook_events") continue;
      throw new Error(upsert.error.message);
    }
    return "process";
  }

  throw new Error("No webhook idempotency table available");
}

async function finishWebhookEventSupabase(eventId: string): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) {
    throw new Error("Supabase admin client unavailable for webhook idempotency");
  }

  for (const table of ["checkout_webhook_events", "stripe_webhook_events"] as const) {
    const update = await sb
      .from(table)
      .update({ status: "success", updated_at: new Date().toISOString() })
      .eq("event_id", eventId);

    if (!update.error) return;
    if (table === "checkout_webhook_events") continue;
    throw new Error(update.error.message);
  }
}

/**
 * Reserve a checkout webhook event for processing. Supabase is the primary store on Railway;
 * D1 remains a fallback for Cloudflare Workers deployments.
 */
export async function beginWebhookEvent(
  db: D1Database | null,
  eventId: string,
): Promise<"process" | "duplicate"> {
  const sb = getSupabaseAdmin();
  if (sb) {
    return beginWebhookEventSupabase(eventId);
  }
  if (db) {
    return beginWebhookEventD1(db, eventId);
  }
  throw new Error("No webhook idempotency backend configured (Supabase or D1 required)");
}

export async function finishWebhookEvent(db: D1Database | null, eventId: string): Promise<void> {
  const sb = getSupabaseAdmin();
  if (sb) {
    await finishWebhookEventSupabase(eventId);
    return;
  }
  if (db) {
    await finishWebhookEventD1(db, eventId);
  }
}
