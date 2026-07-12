import { createFileRoute } from "@tanstack/react-router";
import { getDb } from "@/server/env";
import { updateRegistrationPayment, getRegistrationByStripeSession } from "@/server/db";
import { verifyWebhook } from "@/server/stripe";
import { paymentConfirmedEmail, sendEmail } from "@/server/email";
import { getWhatsappGroupUrl } from "@/lib/site-config";
import { earnAffiliateCommission } from "@/server/affiliates";

function webhookOk() {
  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
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
          const db = await getDb();

          if (event.type === "checkout.session.completed") {
            const session = event.data.object;
            const registrationId = session.metadata?.registrationId;
            const email = session.customer_email ?? session.customer_details?.email;

            if (registrationId) {
              const record = await getRegistrationByStripeSession(db, session.id);
              const wasPaid = record?.payment_status === "paid";

              await updateRegistrationPayment(db, registrationId, {
                payment_status: "paid",
                stripe_session_id: session.id,
              });

              if (record && email && !wasPaid) {
                try {
                  await sendEmail({
                    to: email,
                    subject: "Paiement confirmé — BelKou",
                    html: paymentConfirmedEmail(
                      record.full_name,
                      record.plan,
                      getWhatsappGroupUrl(record.plan),
                    ),
                  });
                } catch (emailError) {
                  console.error("[BelKou] Payment confirmed but email failed:", emailError);
                }
              }

              if (!wasPaid) {
                try {
                  await earnAffiliateCommission(registrationId);
                } catch (affiliateError) {
                  console.error("[BelKou] Affiliate commission failed:", affiliateError);
                }
              }
            }
          }
        } catch (error) {
          // Acknowledge valid Stripe events even if side effects fail — otherwise Stripe retries forever.
          console.error("[BelKou] Stripe webhook handler error:", error);
        }

        return webhookOk();
      },
    },
  },
});
