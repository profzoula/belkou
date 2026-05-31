import { createFileRoute } from "@tanstack/react-router";
import { getDb } from "@/server/env";
import { updateRegistrationPayment, getRegistrationByStripeSession } from "@/server/db";
import { verifyWebhook } from "@/server/stripe";
import { paymentConfirmedEmail, sendEmail } from "@/server/email";
import { siteConfig } from "@/lib/site-config";

export const Route = createFileRoute("/api/stripe/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const signature = request.headers.get("stripe-signature");
        if (!signature) {
          return new Response("Missing signature", { status: 400 });
        }

        const body = await request.text();

        try {
          const event = await verifyWebhook(body, signature);
          const db = await getDb();

          if (event.type === "checkout.session.completed") {
            const session = event.data.object;
            const registrationId = session.metadata?.registrationId;
            const email = session.customer_email ?? session.customer_details?.email;

            if (registrationId) {
              await updateRegistrationPayment(db, registrationId, {
                payment_status: "paid",
                stripe_session_id: session.id,
              });

              const record = await getRegistrationByStripeSession(db, session.id);
              if (record && email) {
                await sendEmail({
                  to: email,
                  subject: "Peman konfime — BelKou",
                  html: paymentConfirmedEmail(
                    record.full_name,
                    record.plan,
                    siteConfig.whatsappGroupUrl,
                    siteConfig.cohortStartDate,
                  ),
                });
              }
            }
          }

          return new Response(JSON.stringify({ received: true }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          console.error("Webhook error:", error);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
