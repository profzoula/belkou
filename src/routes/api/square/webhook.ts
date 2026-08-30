import { createFileRoute } from "@tanstack/react-router";
import { getDb, getServerEnvResolved } from "@/server/env";
import { getRegistrationById } from "@/server/db";
import {
  checkoutSessionFromPayment,
  verifyWebhook,
} from "@/server/square";
import { paymentConfirmedEmail, sendEmail } from "@/server/email";
import { getWhatsappGroupUrlForCourse, siteConfig } from "@/lib/site-config";
import { earnAffiliateCommission } from "@/server/affiliates";
import { grantAccessFromCheckoutSession, isCheckoutPaid } from "@/server/checkout-access";
import { sendOpsAlert } from "@/server/ops-alerts";
import { getResolvedCourseBySlug } from "@/server/site-content";
import { getLiveSession } from "@/server/live";
import { parseLiveTicketSlug, resolveLivePrice } from "@/lib/live";
import { beginWebhookEvent, finishWebhookEvent } from "@/server/checkout-webhook-idempotency";

function webhookOk() {
  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

async function handleCheckoutPaid(session: {
  id: string;
  payment_status?: string | null;
  mode?: string | null;
  amount_total?: number | null;
  currency?: string | null;
  customer_email?: string | null;
  customer_details?: { email?: string | null } | null;
  total_details?: { amount_discount?: number | null } | null;
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
      const liveSessionId = parseLiveTicketSlug(record.course_slug);
      const liveSession = liveSessionId ? await getLiveSession(liveSessionId) : null;
      const course =
        record.course_slug && !liveSessionId
          ? await getResolvedCourseBySlug(record.course_slug)
          : null;
      const fallbackAmount =
        (liveSession ? resolveLivePrice(liveSession.priceUsd) : course?.price) ??
        siteConfig.plans[record.plan].price;
      const emailResult = await sendEmail({
        to,
        subject: "Paiement confirmé — BelKou",
        html: paymentConfirmedEmail(
          record.full_name,
          record.plan,
          getWhatsappGroupUrlForCourse(record.course_slug, record.plan),
          {
            invoiceId: `INV-${record.id.slice(0, 8).toUpperCase()}`,
            itemLabel: liveSession
              ? `Place live — ${liveSession.title}`
              : (course?.title ?? `Plan ${record.plan.toUpperCase()} BelKou`),
            amountUsd:
              typeof session.amount_total === "number"
                ? Math.max(session.amount_total, 0) / 100
                : fallbackAmount,
            currency: session.currency ?? "USD",
            paidAtIso: new Date().toISOString(),
            transactionId: session.id,
            customerEmail: to,
          },
          liveSession
            ? {
                title: liveSession.title,
                scheduledAt: liveSession.scheduledAt,
                url: `${siteConfig.siteUrl.replace(/\/$/, "")}/live/${liveSession.id}`,
              }
            : undefined,
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

export const Route = createFileRoute("/api/square/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const db = await getDb();
        const signature = request.headers.get("x-square-hmacsha256-signature");
        if (!signature) {
          return new Response("Missing signature", { status: 400 });
        }

        const body = await request.text();
        const env = await getServerEnvResolved();
        const notificationUrl = `${env.SITE_URL.replace(/\/$/, "")}/api/square/webhook`;

        let event;
        try {
          event = await verifyWebhook(body, signature, notificationUrl);
        } catch (error) {
          console.error("[BelKou] Square webhook signature failed:", error);
          void sendOpsAlert({
            key: "square-webhook-signature-failed",
            title: "Square webhook signature failed",
            message: "Invalid Square signature received by webhook endpoint.",
            level: "warning",
          });
          return new Response("Invalid signature", { status: 400 });
        }

        const eventId = String(event.event_id || `${event.type}-${Date.now()}`);

        try {
          if ((await beginWebhookEvent(db, eventId)) === "duplicate") {
            return webhookOk();
          }
        } catch (error) {
          console.error("[BelKou] Square webhook idempotency init failed:", error);
          void sendOpsAlert({
            key: "square-webhook-idempotency-init",
            title: "Square webhook idempotency failed",
            message: "BelKou failed to initialize webhook idempotency tracking.",
            meta: { eventId },
          });
          return new Response("Webhook idempotency failed", { status: 500 });
        }

        try {
          if (event.type === "payment.updated" || event.type === "payment.created") {
            const payment = event.data?.object?.payment;
            if (payment?.status === "COMPLETED" && payment.order_id) {
              const session = await checkoutSessionFromPayment(payment);
              if (session) await handleCheckoutPaid(session);
            }
          }
          await finishWebhookEvent(db, eventId);
        } catch (error) {
          console.error("[BelKou] Square webhook handler error:", error);
          void sendOpsAlert({
            key: "square-webhook-handler-error",
            title: "Square webhook handler error",
            message: "BelKou webhook handler returned 500 and Square will retry.",
            meta: { eventId, type: String(event.type) },
          });
          return new Response("Webhook handler failed", { status: 500 });
        }

        return webhookOk();
      },
    },
  },
});
