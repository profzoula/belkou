import { createServerFn } from "@tanstack/react-start";
import { registrationSchema } from "@/lib/schemas/registration";
import { siteConfig, getWhatsappGroupUrl } from "@/lib/site-config";
import { getDb } from "@/server/env";
import { getRegistrationById, saveRegistration, setStripeSessionId, updateRegistrationPayment } from "@/server/db";
import { createCheckoutSession } from "@/server/stripe";
import { paymentConfirmedEmail, registrationPendingEmail, sendEmail } from "@/server/email";
import type { PlanId } from "@/lib/site-config";

function manualPaymentHtml() {
  const lines: string[] = ["<p><strong>Paiement manuel :</strong></p><ul>"];
  if (siteConfig.manualPayment.moncash) {
    lines.push(`<li>MonCash: <strong>${siteConfig.manualPayment.moncash}</strong></li>`);
  }
  if (siteConfig.manualPayment.zelle) {
    lines.push(`<li>Zelle: <strong>${siteConfig.manualPayment.zelle}</strong></li>`);
  }
  if (siteConfig.manualPayment.paypal) {
    lines.push(`<li>PayPal: <strong>${siteConfig.manualPayment.paypal}</strong></li>`);
  }
  if (siteConfig.manualPayment.bankNote) {
    lines.push(`<li>${siteConfig.manualPayment.bankNote}</li>`);
  }
  lines.push("</ul><p>Envoyez la preuve de paiement sur WhatsApp après avoir payé.</p>");
  return lines.join("");
}

export const submitRegistration = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => registrationSchema.parse(data))
  .handler(async ({ data }) => {
    const db = await getDb();
    const record = await saveRegistration(db, data);
    const planConfig = siteConfig.plans[data.plan];
    const manualHtml = manualPaymentHtml();

    let checkoutUrl: string | null = null;

    try {
      const session = await createCheckoutSession({
        registrationId: record.id,
        plan: data.plan,
        email: data.email,
        fullName: data.full_name,
      });

      if (session?.url && session.id) {
        checkoutUrl = session.url;
        await setStripeSessionId(db, record.id, session.id);
      } else {
        await updateRegistrationPayment(db, record.id, { payment_status: "manual_pending" });
      }
    } catch (error) {
      console.error("Stripe checkout error:", error);
      await updateRegistrationPayment(db, record.id, { payment_status: "manual_pending" });
    }

    try {
      await sendEmail({
        to: data.email,
        subject: `Inscription BelKou — ${planConfig.name}`,
        html: registrationPendingEmail({
          name: data.full_name,
          plan: data.plan,
          price: planConfig.price,
          registrationId: record.id,
          checkoutUrl,
          manualPaymentHtml: manualHtml,
        }),
      });
    } catch (error) {
      console.error("Email error:", error);
    }

    return {
      registrationId: record.id,
      checkoutUrl,
      manualPayment: !checkoutUrl,
      plan: data.plan,
    };
  });

export const getRegistrationStatus = createServerFn({ method: "GET" })
  .inputValidator((data: { registrationId: string }) => {
    if (!data.registrationId) throw new Error("registrationId required");
    return data;
  })
  .handler(async ({ data }) => {
    const db = await getDb();
    const { getRegistrationById } = await import("@/server/db");
    const record = await getRegistrationById(db, data.registrationId);
    if (!record) return null;
    return {
      id: record.id,
      plan: record.plan,
      payment_status: record.payment_status,
      full_name: record.full_name,
    };
  });

export const verifyStripeSession = createServerFn({ method: "GET" })
  .inputValidator((data: { sessionId: string; registrationId: string }) => data)
  .handler(async ({ data }) => {
    const { getCheckoutSession } = await import("@/server/stripe");
    const db = await getDb();
    const record = await getRegistrationById(db, data.registrationId);
    const session = await getCheckoutSession(data.sessionId);

    if (!session || session.payment_status !== "paid") {
      return { paid: false as const, plan: record?.plan };
    }

    const plan = (session.metadata?.plan ?? record?.plan) as PlanId | undefined;

    if (session.metadata?.registrationId === data.registrationId && record) {
      const wasPaid = record.payment_status === "paid";
      await updateRegistrationPayment(db, data.registrationId, {
        payment_status: "paid",
        stripe_session_id: session.id,
      });

      if (!wasPaid) {
        try {
          await sendEmail({
            to: record.email,
            subject: "Paiement confirmé — BelKou",
            html: paymentConfirmedEmail(
              record.full_name,
              record.plan,
              getWhatsappGroupUrl(record.plan),
              siteConfig.cohortStartDate,
            ),
          });
        } catch (error) {
          console.error("Payment confirmation email error:", error);
        }
      }
    }

    return { paid: true as const, plan: plan ?? record?.plan };
  });
