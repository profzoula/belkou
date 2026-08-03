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

async function handleCheckoutPaid(session: {
  id: string;
  payment_status?: string | null;
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
  const granted = await grantAccessFromCheckoutSession(db, session);
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
          if (
            event.type === "checkout.session.completed" ||
            event.type === "checkout.session.async_payment_succeeded"
          ) {
            await handleCheckoutPaid(event.data.object);
          }
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
