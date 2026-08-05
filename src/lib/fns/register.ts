import { createServerFn } from "@tanstack/react-start";
import type { RegistrationInput, RegistrationRecord } from "@/lib/schemas/registration";
import { registrationSchema } from "@/lib/schemas/registration";
import { siteConfig, getWhatsappGroupUrl } from "@/lib/site-config";
import { getDb } from "@/server/env";
import {
  getRegistrationByEmailAndCourse,
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
import { LEGACY_COURSE_SLUG } from "@/lib/course-access";
import { getWelcomePreviewLesson } from "@/lib/courses";

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
  if (
    !siteConfig.manualPayment.moncash &&
    !siteConfig.manualPayment.zelle &&
    !siteConfig.manualPayment.paypal &&
    !siteConfig.manualPayment.bankNote
  ) {
    lines.push(
      `<li>Contactez-nous par email : <strong>${siteConfig.contactEmail}</strong> ou WhatsApp pour les instructions de paiement.</li>`,
    );
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
  if (pricing.price <= 0) {
    await updateRegistrationPayment(db, record.id, { payment_status: "paid" });
    return null;
  }

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

    const existing = await getRegistrationByEmailAndCourse(db, data.email, data.course_slug ?? null);
    let record: RegistrationRecord;
    let resumed = false;

    if (existing) {
      if (existing.payment_status === "paid") {
        throw new Error(
          "Vous avez déjà accès à ce cours. Connectez-vous sur /login pour continuer.",
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
      if (!attribution.ok) {
        if (attribution.reason === "self_referral") {
          console.warn("[BelKou] Self-referral blocked:", data.email);
        } else if (attribution.reason === "tables_unavailable") {
          console.error(
            "[BelKou] Affiliate attribution skipped — tables missing. Run migrations/supabase_affiliates.sql",
          );
        } else {
          console.warn("[BelKou] Affiliate attribution failed:", attribution.reason);
        }
      }
    }

    const pricing = await resolveCheckoutPricing(data);
    const manualHtml = manualPaymentHtml();
    const checkoutUrl = await startCheckout(db, record, pricing);

    void sendEmail({
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
    })
      .then((emailResult) => {
        if (!emailResult.ok) {
          console.error("[BelKou] Registration email not sent:", emailResult);
        }
      })
      .catch((error) => {
        console.error("Email error:", error);
      });

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
      email: record.email,
      course_slug: record.course_slug,
    };
  });

export const verifyStripeSession = createServerFn({ method: "GET" })
  .inputValidator((data: { sessionId: string; registrationId: string }) => data)
  .handler(async ({ data }) => {
    const { getCheckoutSession } = await import("@/server/stripe");
    const { grantAccessFromCheckoutSession, isCheckoutPaid } = await import(
      "@/server/stripe-access"
    );
    const db = await getDb();
    const record = await getRegistrationById(db, data.registrationId);
    if (record?.stripe_session_id && record.stripe_session_id !== data.sessionId) {
      console.error("[BelKou] Stripe session mismatch for registration", {
        expectedSessionId: record.stripe_session_id,
        receivedSessionId: data.sessionId,
        registrationId: data.registrationId,
      });
      return { paid: false as const, plan: record?.plan };
    }
    const session = await getCheckoutSession(data.sessionId);

    if (!session || !isCheckoutPaid(session)) {
      return { paid: false as const, plan: record?.plan };
    }

    const plan = (session.metadata?.plan ?? record?.plan) as PlanId | undefined;
    const granted = await grantAccessFromCheckoutSession(db, {
      ...session,
      metadata: {
        ...(session.metadata ?? {}),
        // Prefer the registration from the success URL when Stripe metadata is missing.
        registrationId: session.metadata?.registrationId || data.registrationId,
      },
    }, {
      requireRegistrationMetadata: true,
      allowEmailCourseFallback: false,
      requireAmountAndCurrencyMatch: true,
    });

    if (!granted) {
      console.error("[BelKou] Stripe session paid but access not granted", {
        sessionId: session.id,
        registrationId: data.registrationId,
      });
      return { paid: false as const, plan: plan ?? record?.plan };
    }

    if (!granted.alreadyPaid) {
      const unlocked = await getRegistrationById(db, granted.registrationId);
      if (unlocked) {
        try {
          await sendEmail({
            to: unlocked.email,
            subject: "Paiement confirmé — BelKou",
            html: paymentConfirmedEmail(
              unlocked.full_name,
              unlocked.plan,
              getWhatsappGroupUrl(unlocked.plan),
            ),
          });
        } catch (error) {
          console.error("Payment confirmation email error:", error);
        }
        await earnAffiliateCommission(granted.registrationId);
      }
    }

    return { paid: true as const, plan: plan ?? record?.plan };
  });

export const getSuccessPageContext = createServerFn({ method: "GET" })
  .inputValidator((data: { registrationId?: string }) => data)
  .handler(async ({ data }) => {
    if (!data.registrationId) {
      return { courseSlug: LEGACY_COURSE_SLUG, welcomeLessonId: undefined as string | undefined };
    }

    const db = await getDb();
    const record = await getRegistrationById(db, data.registrationId);
    const slug = record?.course_slug ?? LEGACY_COURSE_SLUG;
    const course = await getResolvedCourseBySlug(slug);
    const welcome = course ? getWelcomePreviewLesson(course) : undefined;
    return { courseSlug: slug, welcomeLessonId: welcome?.id };
  });
