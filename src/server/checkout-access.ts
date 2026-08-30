import type { RegistrationRecord } from "@/lib/schemas/registration";
import { isLiveTicketPlan, normalizeRegistrationEmail } from "@/lib/schemas/registration";
import {
  getRegistrationByEmailAndCourse,
  getRegistrationById,
  getRegistrationByStripeSession,
  listRegistrationsByEmail,
  updateRegistrationGrant,
  updateRegistrationPayment,
} from "@/server/db";
import { getCheckoutSession } from "@/server/square";
import { hasExpectedCheckoutPricing } from "@/lib/checkout-pricing";

export { hasExpectedCheckoutPricing, hasExpectedCheckoutPricing as hasExpectedStripePricingForSession };

type CheckoutLike = {
  id: string;
  payment_status?: string | null;
  mode?: string | null;
  amount_total?: number | null;
  currency?: string | null;
  customer_email?: string | null;
  customer_details?: { email?: string | null } | null;
  total_details?: { amount_discount?: number | null } | null;
  metadata?: Record<string, string> | null;
};

type ResolveOptions = {
  requireRegistrationMetadata?: boolean;
  allowEmailCourseFallback?: boolean;
};

type GrantOptions = ResolveOptions & {
  requireAmountAndCurrencyMatch?: boolean;
};

export function isCheckoutPaid(session: CheckoutLike): boolean {
  return session.payment_status === "paid" || session.payment_status === "no_payment_required";
}

/** Resolve the registration row Square should unlock for this checkout order. */
export async function resolveRegistrationForCheckout(
  db: D1Database | null,
  session: CheckoutLike,
  options: ResolveOptions = {},
): Promise<RegistrationRecord | null> {
  const registrationId = session.metadata?.registrationId?.trim();
  if (options.requireRegistrationMetadata && !registrationId) {
    return null;
  }

  const bySession = await getRegistrationByStripeSession(db, session.id);
  if (bySession) return bySession;

  if (registrationId) {
    const byId = await getRegistrationById(db, registrationId);
    if (byId) return byId;
  }

  const email = normalizeRegistrationEmail(
    session.customer_email ?? session.customer_details?.email ?? "",
  );
  const courseSlug = session.metadata?.courseSlug?.trim() || null;
  if (options.allowEmailCourseFallback !== false && email) {
    const byEmailCourse = await getRegistrationByEmailAndCourse(db, email, courseSlug);
    if (byEmailCourse) return byEmailCourse;
  }

  return null;
}

/**
 * Mark registration paid from a confirmed Square order/payment.
 * Returns the registration id that received access, or null if nothing was updated.
 */
export async function grantAccessFromCheckoutSession(
  db: D1Database | null,
  session: CheckoutLike,
  options: GrantOptions = {},
): Promise<{ registrationId: string; alreadyPaid: boolean } | null> {
  if (!isCheckoutPaid(session)) return null;

  if (options.requireAmountAndCurrencyMatch && !hasExpectedCheckoutPricing(session)) {
    console.error("[BelKou] Checkout pricing verification failed", {
      sessionId: session.id,
      expectedAmountCents: session.metadata?.expectedAmountCents,
      amountTotal: session.amount_total,
      expectedCurrency: session.metadata?.expectedCurrency,
      currency: session.currency,
    });
    return null;
  }

  const record = await resolveRegistrationForCheckout(db, session, options);
  if (!record) {
    console.error("[BelKou] Checkout paid but no registration found for order", {
      sessionId: session.id,
      registrationId: session.metadata?.registrationId,
      email: maskEmail(session.customer_email ?? session.customer_details?.email ?? ""),
      courseSlug: session.metadata?.courseSlug,
    });
    return null;
  }

  const alreadyPaid = record.payment_status === "paid";
  const metadataPlan = session.metadata?.plan?.trim();
  const shouldUpgradeLiveTicket =
    alreadyPaid &&
    isLiveTicketPlan(record.plan) &&
    (metadataPlan === "premium" || metadataPlan === "vip");

  if (!alreadyPaid) {
    await updateRegistrationPayment(db, record.id, {
      payment_status: "paid",
      stripe_session_id: session.id,
    });
  } else if (session.id && record.stripe_session_id !== session.id) {
    await updateRegistrationPayment(db, record.id, {
      payment_status: "paid",
      stripe_session_id: session.id,
    });
  }

  if (shouldUpgradeLiveTicket && (metadataPlan === "premium" || metadataPlan === "vip")) {
    await updateRegistrationGrant(db, record.id, {
      plan: metadataPlan,
      payment_status: "paid",
    });
  }

  return { registrationId: record.id, alreadyPaid: alreadyPaid && !shouldUpgradeLiveTicket };
}

function maskEmail(value: string): string {
  const [name, domain] = value.split("@");
  if (!name || !domain) return "masked";
  const safeName = name.length <= 2 ? `${name[0] ?? "*"}*` : `${name.slice(0, 2)}***`;
  return `${safeName}@${domain}`;
}

/** Heal pending enrollments that Square already completed (webhook miss / lag). */
export async function reconcilePendingCheckoutPaymentsForEmail(
  db: D1Database | null,
  email: string,
): Promise<number> {
  const rows = await listRegistrationsByEmail(db, email);
  let healed = 0;

  for (const row of rows) {
    if (row.payment_status === "paid") continue;
    if (!row.stripe_session_id) continue;

    try {
      const session = await getCheckoutSession(row.stripe_session_id);
      if (!session || !isCheckoutPaid(session)) continue;

      const result = await grantAccessFromCheckoutSession(db, session, {
        requireRegistrationMetadata: true,
        allowEmailCourseFallback: false,
        requireAmountAndCurrencyMatch: true,
      });
      if (result && !result.alreadyPaid) healed += 1;
    } catch (error) {
      console.warn("[BelKou] Checkout reconcile failed for", row.id, error);
    }
  }

  return healed;
}

/** @deprecated Use reconcilePendingCheckoutPaymentsForEmail */
export const reconcilePendingStripePaymentsForEmail = reconcilePendingCheckoutPaymentsForEmail;
