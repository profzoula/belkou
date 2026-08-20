import Stripe from "stripe";
import { getServerEnvResolved } from "@/server/env";
import { LIVE_TICKET_PRICE_USD, parseLiveTicketSlug } from "@/lib/live";
import { siteConfig, type PlanId } from "@/lib/site-config";

export async function getStripe(): Promise<Stripe | null> {
  const env = await getServerEnvResolved();
  if (!env.STRIPE_SECRET_KEY) return null;
  return new Stripe(env.STRIPE_SECRET_KEY);
}

export async function createCheckoutSession(params: {
  registrationId: string;
  plan: PlanId;
  email: string;
  fullName: string;
  courseSlug?: string;
  courseTitle?: string;
  amountUsd?: number;
}) {
  const stripe = await getStripe();
  const env = await getServerEnvResolved();
  if (!stripe) return null;

  const isLiveCheckout = params.plan === "live";
  const isVipMembership = params.plan === "vip";
  const isCourseCheckout =
    Boolean(params.courseSlug && params.amountUsd != null) && !isLiveCheckout && !isVipMembership;

  const priceId = isCourseCheckout || isLiveCheckout || isVipMembership
    ? null
    : params.plan === "premium"
      ? env.STRIPE_PRICE_PREMIUM
      : env.STRIPE_PRICE_VIP;

  const liveAmount = Math.round((params.amountUsd ?? LIVE_TICKET_PRICE_USD) * 100);
  const vipAmount = Math.round(siteConfig.plans.vip.price * 100);

  const lineItem = isLiveCheckout
    ? {
        price_data: {
          currency: "usd" as const,
          unit_amount: liveAmount,
          product_data: {
            name: `Accès live — ${params.courseTitle ?? "BelKou"}`,
            description: "Place réservée pour ce live BelKou : direct, commentaires et replay",
          },
        },
        quantity: 1,
      }
    : isVipMembership
    ? {
        price_data: {
          currency: "usd" as const,
          unit_amount: vipAmount,
          product_data: {
            name: "BelKou VIP — Accès illimité",
            description: "Tous les cours et tous les lives BelKou, à vie",
          },
        },
        quantity: 1,
      }
    : isCourseCheckout
    ? {
        price_data: {
          currency: "usd",
          unit_amount: Math.round(params.amountUsd! * 100),
          product_data: {
            name: params.courseTitle ?? "Cours BelKou",
            description: "Accès complet au cours BelKou",
          },
        },
        quantity: 1,
      }
    : priceId
      ? { price: priceId, quantity: 1 }
      : {
          price_data: {
            currency: "usd",
            unit_amount: params.plan === "premium" ? 19900 : vipAmount,
            product_data: {
              name: `BelKou ${params.plan === "premium" ? "Premium" : "VIP"}`,
              description:
                params.plan === "vip"
                  ? "Tous les cours et tous les lives BelKou, à vie"
                  : "Formation BelKou — formation en ligne",
            },
          },
          quantity: 1,
        };

  const expectedAmountCents = isLiveCheckout
    ? liveAmount
    : isVipMembership
      ? vipAmount
    : isCourseCheckout
      ? Math.round(params.amountUsd! * 100)
      : priceId
        ? null
        : params.plan === "premium"
          ? 19900
          : vipAmount;

  const liveSessionId = isLiveCheckout ? parseLiveTicketSlug(params.courseSlug) : null;
  const cancelUrl = isVipMembership
    ? `${env.SITE_URL}/checkout?plan=vip`
    : isLiveCheckout
      ? liveSessionId
        ? `${env.SITE_URL}/checkout?plan=live&session=${encodeURIComponent(liveSessionId)}`
        : `${env.SITE_URL}/live`
      : params.courseSlug
        ? `${env.SITE_URL}/checkout?course=${encodeURIComponent(params.courseSlug)}`
        : `${env.SITE_URL}/checkout?plan=${params.plan}`;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    client_reference_id: params.registrationId,
    customer_email: params.email,
    payment_method_types: ["card"],
    line_items: [lineItem],
    success_url: `${env.SITE_URL}/success?registrationId=${params.registrationId}&plan=${params.plan}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    metadata: {
      registrationId: params.registrationId,
      plan: params.plan,
      fullName: params.fullName,
      expectedCurrency: "usd",
      ...(expectedAmountCents != null ? { expectedAmountCents: String(expectedAmountCents) } : {}),
      ...(params.courseSlug ? { courseSlug: params.courseSlug } : {}),
    },
  });

  return session;
}

export async function getCheckoutSession(sessionId: string) {
  const stripe = await getStripe();
  if (!stripe) return null;
  return stripe.checkout.sessions.retrieve(sessionId);
}

export async function verifyWebhook(body: string, signature: string) {
  const stripe = await getStripe();
  const env = await getServerEnvResolved();
  if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
    throw new Error("Stripe webhook not configured");
  }
  // Async variant on purpose: the bundled SDK resolves to the Web Crypto provider,
  // which refuses to run the synchronous constructEvent.
  return stripe.webhooks.constructEventAsync(body, signature, env.STRIPE_WEBHOOK_SECRET);
}
