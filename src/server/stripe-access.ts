import type { RegistrationRecord } from "@/lib/schemas/registration";
import { normalizeRegistrationEmail } from "@/lib/schemas/registration";
import {
  getRegistrationByEmailAndCourse,
  getRegistrationById,
  getRegistrationByStripeSession,
  listRegistrationsByEmail,
  updateRegistrationPayment,
} from "@/server/db";
import { getCheckoutSession } from "@/server/stripe";

type CheckoutLike = {
  id: string;
  payment_status?: string | null;
  customer_email?: string | null;
  customer_details?: { email?: string | null } | null;
  metadata?: Record<string, string> | null;
};

export function isCheckoutPaid(session: CheckoutLike): boolean {
  return session.payment_status === "paid" || session.payment_status === "no_payment_required";
}

/** Resolve the registration row Stripe should unlock for this checkout session. */
export async function resolveRegistrationForCheckout(
  db: D1Database | null,
  session: CheckoutLike,
): Promise<RegistrationRecord | null> {
  const registrationId = session.metadata?.registrationId?.trim();
  if (registrationId) {
    const byId = await getRegistrationById(db, registrationId);
    if (byId) return byId;
  }

  const bySession = await getRegistrationByStripeSession(db, session.id);
  if (bySession) return bySession;

  const email = normalizeRegistrationEmail(
    session.customer_email ?? session.customer_details?.email ?? "",
  );
  const courseSlug = session.metadata?.courseSlug?.trim() || null;
  if (email) {
    const byEmailCourse = await getRegistrationByEmailAndCourse(db, email, courseSlug);
    if (byEmailCourse) return byEmailCourse;
  }

  return null;
}

/**
 * Mark registration paid from a confirmed Stripe Checkout session.
 * Returns the registration id that received access, or null if nothing was updated.
 */
export async function grantAccessFromCheckoutSession(
  db: D1Database | null,
  session: CheckoutLike,
): Promise<{ registrationId: string; alreadyPaid: boolean } | null> {
  if (!isCheckoutPaid(session)) return null;

  const record = await resolveRegistrationForCheckout(db, session);
  if (!record) {
    console.error("[BelKou] Stripe paid but no registration found for session", {
      sessionId: session.id,
      registrationId: session.metadata?.registrationId,
      email: session.customer_email ?? session.customer_details?.email,
      courseSlug: session.metadata?.courseSlug,
    });
    return null;
  }

  const alreadyPaid = record.payment_status === "paid";
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

  return { registrationId: record.id, alreadyPaid };
}

/** Heal pending enrollments that Stripe already marked paid (webhook miss / D1 lag). */
export async function reconcilePendingStripePaymentsForEmail(
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

      const result = await grantAccessFromCheckoutSession(db, session);
      if (result && !result.alreadyPaid) healed += 1;
    } catch (error) {
      console.warn("[BelKou] Stripe reconcile failed for", row.id, error);
    }
  }

  return healed;
}
