import Stripe from "stripe";
import { getServerEnvResolved } from "@/server/env";
import type { PlanId } from "@/lib/site-config";

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

  const isCourseCheckout = Boolean(params.courseSlug && params.amountUsd != null);

  const priceId = isCourseCheckout
    ? null
    : params.plan === "premium"
      ? env.STRIPE_PRICE_PREMIUM
      : env.STRIPE_PRICE_VIP;

  const lineItem = isCourseCheckout
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
            unit_amount: params.plan === "premium" ? 19900 : 29000,
            product_data: {
              name: `BelKou ${params.plan === "premium" ? "Premium" : "VIP"}`,
              description: "Formation BelKou — apps IA & SaaS",
            },
          },
          quantity: 1,
        };

  const cancelUrl = params.courseSlug
    ? `${env.SITE_URL}/checkout?course=${encodeURIComponent(params.courseSlug)}`
    : `${env.SITE_URL}/checkout?plan=${params.plan}`;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: params.email,
    payment_method_types: ["card"],
    line_items: [lineItem],
    success_url: `${env.SITE_URL}/success?registrationId=${params.registrationId}&plan=${params.plan}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    metadata: {
      registrationId: params.registrationId,
      plan: params.plan,
      fullName: params.fullName,
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
  return stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
}
