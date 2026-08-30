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
import { createPaymentLink } from "@/server/square";
import { paymentConfirmedEmail, registrationPendingEmail, sendEmail } from "@/server/email";
import type { PlanId } from "@/lib/site-config";
import { attributeReferral, earnAffiliateCommission } from "@/server/affiliates";
import { getResolvedCourseBySlug } from "@/server/site-content";
import { LEGACY_COURSE_SLUG, VIP_MEMBERSHIP_SLUG } from "@/lib/course-access";
import { isLiveTicketPlan } from "@/lib/schemas/registration";
import { liveTicketSlug, parseLiveTicketSlug, resolveLivePrice } from "@/lib/live";
import { getWelcomePreviewLesson } from "@/lib/courses";
import { hasCheckoutOrderProof } from "@/lib/registration-status-access";

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
    const sessionId = parseLiveTicketSlug(data.course_slug);
    if (!sessionId) {
      throw new Error("Choisissez le live que vous voulez réserver.");
    }
    const { getLiveSession } = await import("@/server/live");
    const session = await getLiveSession(sessionId);
    if (!session || session.status === "canceled") {
      throw new Error("Live introuvable.");
    }
    return {
      price: resolveLivePrice(session.priceUsd),
      label: `Accès live — ${session.title}`,
      courseSlug: liveTicketSlug(sessionId),
      courseTitle: session.title,
      liveEvent: {
        title: session.title,
        scheduledAt: session.scheduledAt,
        url: `${siteConfig.siteUrl.replace(/\/$/, "")}/live/${session.id}`,
      },
    };
  }

  if (data.course_slug) {
    // Always read the latest admin price for checkout + confirmation emails.
    const course = await getResolvedCourseBySlug(data.course_slug, { fresh: true });
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
  // Free checkout only when the quote is free AND there is no open paid checkout
  // session on this registration (avoids unlocking after a failed Square attempt
  // if the admin briefly flips the course to $0).
  if (pricing.price <= 0) {
    if (record.stripe_session_id?.trim() && record.payment_status !== "paid") {
      console.warn("[BelKou] Refusing free unlock on registration with open checkout", {
        registrationId: record.id,
        payment_status: record.payment_status,
      });
      return null;
    }
    await updateRegistrationPayment(db, record.id, { payment_status: "paid" });
    return null;
  }

  let checkoutUrl: string | null = null;
  const alreadyPaid = record.payment_status === "paid";

  try {
    const session = await createPaymentLink({
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
    console.error("Square checkout error:", error);
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

    const liveSessionId = raw.plan === "live" ? parseLiveTicketSlug(raw.course_slug) : null;
    if (raw.plan === "live" && !liveSessionId) {
      throw new Error("Choisissez le live que vous voulez réserver.");
    }

    const data = {
      ...raw,
      course_slug:
        raw.plan === "vip"
          ? VIP_MEMBERSHIP_SLUG
          : liveSessionId
            ? liveTicketSlug(liveSessionId)
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
            "Votre place est déjà réservée pour ce live. Connectez-vous pour y accéder.",
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
    // A free event still needs a reservation row, but there is nothing to pay for.
    const free = pricing.price <= 0;

    void sendEmail({
      to: data.email,
      subject: free
        ? `Place réservée — ${pricing.label}`
        : resumed
          ? `Reprise inscription BelKou — ${pricing.label}`
          : `Inscription BelKou — ${pricing.label}`,
      html: free
        ? paymentConfirmedEmail(
            data.full_name,
            data.plan,
            "",
            undefined,
            "liveEvent" in pricing ? pricing.liveEvent : undefined,
          )
        : registrationPendingEmail({
            name: data.full_name,
            plan: data.plan,
            price: pricing.price,
            label: pricing.label,
            registrationId: record.id,
            checkoutUrl,
            manualPaymentHtml: manualHtml,
            courseSlug: data.course_slug,
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
      manualPayment: !checkoutUrl && !free,
      free,
      plan: data.plan,
      resumed,
    };
  });

export const getRegistrationStatus = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z
      .object({
        registrationId: z.string().min(1),
        /** Square order id (URL orderId / legacy session_id). Required for any status. */
        sessionId: z.string().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const db = await getDb();
    const { getRegistrationById } = await import("@/server/db");
    const record = await getRegistrationById(db, data.registrationId);
    if (!record) return null;

    // No checkout order proof → no plan/payment/PII (UUID alone is not authorization).
    if (!hasCheckoutOrderProof(record.stripe_session_id, data.sessionId)) {
      return null;
    }

    return {
      id: record.id,
      plan: record.plan,
      payment_status: record.payment_status,
      course_slug: record.course_slug,
      full_name: record.full_name,
      email: record.email,
    };
  });

export const verifyCheckoutSession = createServerFn({ method: "GET" })
  .inputValidator((data: { sessionId: string; registrationId: string }) => data)
  .handler(async ({ data }) => {
    const { getCheckoutSession } = await import("@/server/square");
    const { grantAccessFromCheckoutSession, isCheckoutPaid } =
      await import("@/server/checkout-access");
    const db = await getDb();
    const record = await getRegistrationById(db, data.registrationId);
    if (record?.stripe_session_id && record.stripe_session_id !== data.sessionId) {
      console.error("[BelKou] Checkout order mismatch for registration", {
        expectedSessionId: record.stripe_session_id,
        receivedSessionId: data.sessionId,
        registrationId: data.registrationId,
      });
      return { paid: false as const };
    }
    const session = await getCheckoutSession(data.sessionId);

    if (!session || !isCheckoutPaid(session)) {
      return { paid: false as const };
    }

    const plan = (session.metadata?.plan ?? record?.plan) as PlanId | undefined;
    const granted = await grantAccessFromCheckoutSession(
      db,
      {
        ...session,
        metadata: {
          ...(session.metadata ?? {}),
          // Prefer the registration from the success URL when order metadata is missing.
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
      console.error("[BelKou] Checkout paid but access not granted", {
        sessionId: session.id,
        registrationId: data.registrationId,
      });
      return { paid: false as const };
    }

    if (!granted.alreadyPaid) {
      const unlocked = await getRegistrationById(db, granted.registrationId);
      if (unlocked) {
        try {
          const liveSessionId = parseLiveTicketSlug(unlocked.course_slug);
          const liveSession = liveSessionId
            ? await (await import("@/server/live")).getLiveSession(liveSessionId)
            : null;
          const course =
            unlocked.course_slug && unlocked.course_slug !== VIP_MEMBERSHIP_SLUG && !liveSessionId
              ? await getResolvedCourseBySlug(unlocked.course_slug)
              : null;
          const fallbackAmount =
            unlocked.plan === "live"
              ? resolveLivePrice(liveSession?.priceUsd)
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
                    : liveSession
                      ? `Place live — ${liveSession.title}`
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
              liveSession
                ? {
                    title: liveSession.title,
                    scheduledAt: liveSession.scheduledAt,
                    url: `${siteConfig.siteUrl.replace(/\/$/, "")}/live/${liveSession.id}`,
                  }
                : undefined,
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

/** @deprecated Use verifyCheckoutSession */
export const verifyStripeSession = verifyCheckoutSession;

export const getSuccessPageContext = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z
      .object({
        registrationId: z.string().optional(),
        sessionId: z.string().optional(),
        /** Client-known slug (free/manual success) — public course metadata only. */
        courseSlug: z.string().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const empty = {
      courseSlug: LEGACY_COURSE_SLUG,
      welcomeLessonId: undefined as string | undefined,
    };

    let slug = data.courseSlug?.trim() || undefined;

    if (data.registrationId?.trim() && data.sessionId?.trim()) {
      const db = await getDb();
      const record = await getRegistrationById(db, data.registrationId);
      if (record && hasCheckoutOrderProof(record.stripe_session_id, data.sessionId)) {
        slug = record.course_slug ?? slug;
        if (slug === VIP_MEMBERSHIP_SLUG || record.plan === "vip") {
          return empty;
        }
      }
    }

    if (!slug || slug === VIP_MEMBERSHIP_SLUG) {
      return empty;
    }

    const course = await getResolvedCourseBySlug(slug);
    const welcome = course ? getWelcomePreviewLesson(course) : undefined;
    return { courseSlug: slug, welcomeLessonId: welcome?.id };
  });
