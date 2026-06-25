import { createServerFn } from "@tanstack/react-start";
import { registrationSchema } from "@/lib/schemas/registration";
import type { RegistrationRecord } from "@/lib/schemas/registration";
import { siteConfig, getWhatsappGroupUrl } from "@/lib/site-config";
import { getDb } from "@/server/env";
import {
  getRegistrationByEmail,
  getRegistrationById,
  saveRegistration,
  setStripeSessionId,
  updateRegistrationDetails,
  updateRegistrationPayment,
} from "@/server/db";
import { checkRateLimit, RATE_LIMITS } from "@/server/rate-limit";
import { createCheckoutSession } from "@/server/stripe";
import { paymentConfirmedEmail, registrationPendingEmail, sendEmail } from "@/server/email";
import type { PlanId } from "@/lib/site-config";
import { attributeReferral, earnAffiliateCommission } from "@/server/affiliates";
import { getResolvedCourseBySlug } from "@/server/site-content";

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

async function resolveCheckoutPricing(data: RegistrationInput) {
  if (data.course_slug) {
    const course = await getResolvedCourseBySlug(data.course_slug);
    if (!course) {
      throw new Error("Cours introuvable.");
    }
    return {
      price: course.price,
      label: course.title,
      courseSlug: course.slug,
      courseTitle: course.title,
    };
  }

  const planConfig = siteConfig.plans[data.plan];
  return {
    price: planConfig.price,
    label: planConfig.name,
    courseSlug: undefined,
    courseTitle: undefined,
  };
}

async function startCheckout(
  db: Awaited<ReturnType<typeof getDb>>,
  record: RegistrationRecord,
  pricing: Awaited<ReturnType<typeof resolveCheckoutPricing>>,
) {
  let checkoutUrl: string | null = null;

  try {
    const session = await createCheckoutSession({
      registrationId: record.id,
      plan: record.plan,
      email: record.email,
      fullName: record.full_name,
      courseSlug: pricing.courseSlug,
      courseTitle: pricing.courseTitle,
      amountUsd: pricing.courseSlug ? pricing.price : undefined,
    });

    if (session?.url && session.id) {
      checkoutUrl = session.url;
      await setStripeSessionId(db, record.id, session.id);
      await updateRegistrationPayment(db, record.id, { payment_status: "pending" });
    } else {
      await updateRegistrationPayment(db, record.id, { payment_status: "manual_pending" });
    }
  } catch (error) {
    console.error("Stripe checkout error:", error);
    await updateRegistrationPayment(db, record.id, { payment_status: "manual_pending" });
  }

  return checkoutUrl;
}

export const submitRegistration = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => registrationSchema.parse(data))
  .handler(async ({ data }) => {
    const db = await getDb();

    const allowed = checkRateLimit(`register:${data.email}`, RATE_LIMITS.register.limit, RATE_LIMITS.register.windowMs);
    if (!allowed) {
      throw new Error("Trop de tentatives. Attendez quelques minutes puis réessayez.");
    }

    const existing = await getRegistrationByEmail(db, data.email);
    let record: RegistrationRecord;
    let resumed = false;

    if (existing) {
      if (existing.payment_status === "paid") {
        throw new Error(
          "Cet email est déjà inscrit et payé. Connectez-vous sur /login pour accéder à votre espace.",
        );
      }

      const updated = await updateRegistrationDetails(db, existing.id, data);
      record = updated ?? { ...existing, ...data };
      resumed = true;
    } else {
      record = await saveRegistration(db, data);
    }

    if (data.referral_code) {
      const attribution = await attributeReferral({
        registrationId: record.id,
        referredEmail: data.email,
        referralCode: data.referral_code,
      });
      if (!attribution.ok && attribution.reason === "self_referral") {
        console.warn("[BelKou] Self-referral blocked:", data.email);
      }
    }

    const pricing = await resolveCheckoutPricing(data);
    const manualHtml = manualPaymentHtml();
    const checkoutUrl = await startCheckout(db, record, pricing);

    try {
      await sendEmail({
        to: data.email,
        subject: resumed
          ? `Reprise inscription BelKou — ${pricing.label}`
          : `Inscription BelKou — ${pricing.label}`,
        html: registrationPendingEmail({
          name: data.full_name,
          plan: data.plan,
          price: pricing.price,
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
      resumed,
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

        await earnAffiliateCommission(data.registrationId);
      }
    }

    return { paid: true as const, plan: plan ?? record?.plan };
  });
