import { createFileRoute } from "@tanstack/react-router";
import { getDb } from "@/server/env";
import { getRegistrationById } from "@/server/db";
import { verifyWebhook } from "@/server/stripe";
import { paymentConfirmedEmail, sendEmail } from "@/server/email";
import { getWhatsappGroupUrl } from "@/lib/site-config";
import { earnAffiliateCommission } from "@/server/affiliates";
import { grantAccessFromCheckoutSession, isCheckoutPaid } from "@/server/stripe-access";

function webhookOk() {
  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

const WEBHOOK_EVENTS_SQL = `
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  event_id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;

async function beginWebhookEvent(
  db: D1Database | null,
  eventId: string,
): Promise<"process" | "duplicate"> {
  if (!db) return "process";
  await db.exec(WEBHOOK_EVENTS_SQL);

  const existing = await db
    .prepare(`SELECT status FROM stripe_webhook_events WHERE event_id = ?`)
    .bind(eventId)
    .first<{ status?: string | null }>();
  if (existing?.status === "success") return "duplicate";

  await db
    .prepare(
      `INSERT INTO stripe_webhook_events (event_id, status, updated_at)
       VALUES (?, 'processing', ?)
       ON CONFLICT(event_id) DO UPDATE SET status = 'processing', updated_at = excluded.updated_at`,
    )
    .bind(eventId, new Date().toISOString())
    .run();
  return "process";
}

async function finishWebhookEvent(db: D1Database | null, eventId: string): Promise<void> {
  if (!db) return;
  await db
    .prepare(`UPDATE stripe_webhook_events SET status = 'success', updated_at = ? WHERE event_id = ?`)
    .bind(new Date().toISOString(), eventId)
    .run();
}

async function handleCheckoutPaid(session: {
  id: string;
  payment_status?: string | null;
  mode?: string | null;
  amount_total?: number | null;
  currency?: string | null;
  customer_email?: string | null;
  customer_details?: { email?: string | null } | null;
  metadata?: Record<string, string> | null;
}) {
  if (!isCheckoutPaid(session)) {
    console.info("[BelKou] Checkout completed but not paid yet — waiting for async payment", {
      sessionId: session.id,
      payment_status: session.payment_status,
    });
    return;
  }

  const db = await getDb();
  const granted = await grantAccessFromCheckoutSession(db, session, {
    requireRegistrationMetadata: true,
    allowEmailCourseFallback: false,
    requireAmountAndCurrencyMatch: true,
  });
  if (!granted) return;

  const record = await getRegistrationById(db, granted.registrationId);
  if (!record || granted.alreadyPaid) return;

  const to = session.customer_email ?? session.customer_details?.email ?? record.email;
  if (to) {
    try {
      const emailResult = await sendEmail({
        to,
        subject: "Paiement confirmé — BelKou",
        html: paymentConfirmedEmail(
          record.full_name,
          record.plan,
          getWhatsappGroupUrl(record.plan),
        ),
      });
      if (!emailResult.ok) {
        console.error("[BelKou] Payment confirmed but email not sent:", emailResult);
      }
    } catch (emailError) {
      console.error("[BelKou] Payment confirmed but email failed:", emailError);
    }
  }

  try {
    await earnAffiliateCommission(granted.registrationId);
  } catch (affiliateError) {
    console.error("[BelKou] Affiliate commission failed:", affiliateError);
  }
}

export const Route = createFileRoute("/api/stripe/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const db = await getDb();
        const signature = request.headers.get("stripe-signature");
        if (!signature) {
          return new Response("Missing signature", { status: 400 });
        }

        const body = await request.text();

        let event;
        try {
          event = await verifyWebhook(body, signature);
        } catch (error) {
          console.error("[BelKou] Stripe webhook signature failed:", error);
          return new Response("Invalid signature", { status: 400 });
        }

        try {
          if ((await beginWebhookEvent(db, String(event.id))) === "duplicate") {
            return webhookOk();
          }
        } catch (error) {
          console.error("[BelKou] Stripe webhook idempotency init failed:", error);
          return new Response("Webhook idempotency failed", { status: 500 });
        }

        try {
          if (
            event.type === "checkout.session.completed" ||
            event.type === "checkout.session.async_payment_succeeded"
          ) {
            await handleCheckoutPaid(event.data.object);
          }
          await finishWebhookEvent(db, String(event.id));
        } catch (error) {
          // Retryable: Stripe will redeliver until access is granted.
          console.error("[BelKou] Stripe webhook handler error:", error);
          return new Response("Webhook handler failed", { status: 500 });
        }

        return webhookOk();
      },
    },
  },
});
