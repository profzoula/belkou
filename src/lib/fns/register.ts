import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { RegistrationInput, RegistrationRecord } from "@/lib/schemas/registration";
import { registrationSchema } from "@/lib/schemas/registration";
import { siteConfig, getWhatsappGroupUrlForCourse } from "@/lib/site-config";
import { getDb } from "@/server/env";
import {
  getRegistrationByEmailAndCourse,
  getRegistrationById,
  listRegistrationsByEmail,
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
import { LEGACY_COURSE_SLUG, VIP_MEMBERSHIP_SLUG } from "@/lib/course-access";
import { isLiveTicketPlan } from "@/lib/schemas/registration";
import { LIVE_TICKET_PRICE_USD, STANDALONE_LIVE_SLUG, isStandaloneLiveSlug } from "@/lib/live";
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
  if (data.plan === "vip") {
    return {
      price: siteConfig.plans.vip.price,
      label: "Accès illimité VIP",
      courseSlug: VIP_MEMBERSHIP_SLUG,
      courseTitle: "BelKou VIP — Accès illimité",
    };
  }

  if (data.plan === "live") {
    if (data.course_slug && !isStandaloneLiveSlug(data.course_slug)) {
      const course = await getResolvedCourseBySlug(data.course_slug);
      if (!course) {
        throw new Error("Cours introuvable.");
      }
      return {
        price: LIVE_TICKET_PRICE_USD,
        label: `Accès live — ${course.title}`,
        courseSlug: course.slug,
        courseTitle: course.title,
      };
    }
    return {
      price: LIVE_TICKET_PRICE_USD,
      label: "Accès live BelKou",
      courseSlug: STANDALONE_LIVE_SLUG,
      courseTitle: "BelKou Live",
    };
  }

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
  intendedPlan: RegistrationRecord["plan"],
) {
  if (pricing.price <= 0) {
    await updateRegistrationPayment(db, record.id, { payment_status: "paid" });
    return null;
  }

  let checkoutUrl: string | null = null;
  const alreadyPaid = record.payment_status === "paid";

  try {
    const session = await createCheckoutSession({
      registrationId: record.id,
      plan: intendedPlan,
      email: record.email,
      fullName: record.full_name,
      courseSlug: pricing.courseSlug,
      courseTitle: pricing.courseTitle,
      amountUsd: intendedPlan === "vip" || pricing.courseSlug ? pricing.price : undefined,
    });

    if (session?.url && session.id) {
      checkoutUrl = session.url;
      await setStripeSessionId(db, record.id, session.id);
      if (!alreadyPaid) {
        await updateRegistrationPayment(db, record.id, { payment_status: "pending" });
      }
    } else if (!alreadyPaid) {
      await updateRegistrationPayment(db, record.id, { payment_status: "manual_pending" });
    }
  } catch (error) {
    console.error("Stripe checkout error:", error);
    if (!alreadyPaid) {
      await updateRegistrationPayment(db, record.id, { payment_status: "manual_pending" });
    }
  }

  return checkoutUrl;
}

export const submitRegistration = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => registrationSchema.parse(data))
  .handler(async ({ data: raw }) => {
    const db = await getDb();

    const allowed = checkRateLimit(
      `register:${raw.email}`,
      RATE_LIMITS.register.limit,
      RATE_LIMITS.register.windowMs,
    );
    if (!allowed) {
      throw new Error("Trop de tentatives. Attendez quelques minutes puis réessayez.");
    }

    const data = {
      ...raw,
      course_slug:
        raw.plan === "vip"
          ? VIP_MEMBERSHIP_SLUG
          : raw.plan === "live"
            ? (raw.course_slug && !isStandaloneLiveSlug(raw.course_slug)
              ? raw.course_slug
              : STANDALONE_LIVE_SLUG)
            : raw.course_slug,
    };

    const existingRows = await listRegistrationsByEmail(db, data.email);
    if (existingRows.some((row) => row.payment_status === "paid" && row.plan === "vip")) {
      throw new Error(
        "Vous avez déjà l'accès illimité VIP (tous les cours et lives). Connectez-vous sur /login pour continuer.",
      );
    }

    const existing = await getRegistrationByEmailAndCourse(
      db,
      data.email,
      data.course_slug ?? null,
    );
    let record: RegistrationRecord;
    let resumed = false;

    if (existing) {
      if (existing.payment_status === "paid") {
        if (data.plan === "vip") {
          throw new Error(
            "Vous avez déjà l'accès illimité VIP. Connectez-vous sur /login pour continuer.",
          );
        }
        if (data.plan === "live") {
          throw new Error(
            "Vous avez déjà accès au live de ce cours. Connectez-vous pour le regarder.",
          );
        }
        if (!isLiveTicketPlan(existing.plan)) {
          throw new Error(
            "Vous avez déjà accès à ce cours. Connectez-vous sur /login pour continuer.",
          );
        }
        record = existing;
        resumed = true;
      } else {
        const updated = await updateRegistrationDetails(db, existing.id, data);
        record = updated ?? {
          ...existing,
          ...data,
          course_slug: data.course_slug ?? existing.course_slug ?? null,
        };
        resumed = true;
      }
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
    const checkoutUrl = await startCheckout(db, record, pricing, data.plan);

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
  .inputValidator((data: unknown) =>
    z
      .object({
        registrationId: z.string().min(1),
        sessionId: z.string().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const db = await getDb();
    const { getRegistrationById } = await import("@/server/db");
    const record = await getRegistrationById(db, data.registrationId);
    if (!record) return null;

    const base = {
      id: record.id,
      plan: record.plan,
      payment_status: record.payment_status,
      course_slug: record.course_slug,
    };

    const sessionId = data.sessionId?.trim();
    if (!sessionId || !record.stripe_session_id || record.stripe_session_id !== sessionId) {
      return base;
    }

    return {
      ...base,
      full_name: record.full_name,
      email: record.email,
    };
  });

export const verifyStripeSession = createServerFn({ method: "GET" })
  .inputValidator((data: { sessionId: string; registrationId: string }) => data)
  .handler(async ({ data }) => {
    const { getCheckoutSession } = await import("@/server/stripe");
    const { grantAccessFromCheckoutSession, isCheckoutPaid } =
      await import("@/server/stripe-access");
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
    const granted = await grantAccessFromCheckoutSession(
      db,
      {
        ...session,
        metadata: {
          ...(session.metadata ?? {}),
          // Prefer the registration from the success URL when Stripe metadata is missing.
          registrationId: session.metadata?.registrationId || data.registrationId,
        },
      },
      {
        requireRegistrationMetadata: true,
        allowEmailCourseFallback: false,
        requireAmountAndCurrencyMatch: true,
      },
    );

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
          const course =
            unlocked.course_slug && unlocked.course_slug !== VIP_MEMBERSHIP_SLUG
              ? await getResolvedCourseBySlug(unlocked.course_slug)
              : null;
          const fallbackAmount =
            unlocked.plan === "live"
              ? LIVE_TICKET_PRICE_USD
              : unlocked.plan === "vip"
                ? siteConfig.plans.vip.price
                : (course?.price ?? siteConfig.plans[unlocked.plan].price);
          await sendEmail({
            to: unlocked.email,
            subject: "Paiement confirmé — BelKou",
            html: paymentConfirmedEmail(
              unlocked.full_name,
              unlocked.plan,
              getWhatsappGroupUrlForCourse(unlocked.course_slug, unlocked.plan),
              {
                invoiceId: `INV-${unlocked.id.slice(0, 8).toUpperCase()}`,
                itemLabel:
                  unlocked.plan === "vip"
                    ? "Accès illimité VIP"
                    : (course?.title ?? `Plan ${unlocked.plan.toUpperCase()} BelKou`),
                amountUsd:
                  typeof session.amount_total === "number"
                    ? Math.max(session.amount_total, 0) / 100
                    : fallbackAmount,
                currency: session.currency ?? "USD",
                paidAtIso: new Date().toISOString(),
                transactionId: session.id,
                customerEmail: unlocked.email,
              },
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
    if (slug === VIP_MEMBERSHIP_SLUG || record?.plan === "vip") {
      return { courseSlug: LEGACY_COURSE_SLUG, welcomeLessonId: undefined as string | undefined };
    }
    const course = await getResolvedCourseBySlug(slug);
    const welcome = course ? getWelcomePreviewLesson(course) : undefined;
    return { courseSlug: slug, welcomeLessonId: welcome?.id };
  });
