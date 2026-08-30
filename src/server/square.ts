import { getServerEnvResolved } from "@/server/env";
import { LIVE_TICKET_PRICE_USD, parseLiveTicketSlug } from "@/lib/live";
import { siteConfig, type PlanId } from "@/lib/site-config";

export type SquareCheckoutSession = {
  id: string;
  url: string | null;
  payment_status: "paid" | "unpaid" | "no_payment_required";
  mode: "payment";
  amount_total: number | null;
  currency: string | null;
  customer_email: string | null;
  customer_details: { email?: string | null } | null;
  total_details: { amount_discount?: number | null } | null;
  metadata: Record<string, string>;
};

type SquareApiError = {
  errors?: Array<{ detail?: string; code?: string }>;
};

function squareBaseUrl(environment: string | undefined): string {
  return environment === "production"
    ? "https://connect.squareup.com"
    : "https://connect.squareupsandbox.com";
}

async function squareFetch<T>(
  path: string,
  init: RequestInit & { accessToken: string; environment?: string },
): Promise<T> {
  const res = await fetch(`${squareBaseUrl(init.environment)}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${init.accessToken}`,
      "Content-Type": "application/json",
      "Square-Version": "2024-12-18",
      ...(init.headers ?? {}),
    },
  });
  const json = (await res.json().catch(() => ({}))) as T & SquareApiError;
  if (!res.ok) {
    const detail = json.errors?.map((e) => e.detail ?? e.code).filter(Boolean).join("; ");
    throw new Error(detail || `Square API ${res.status}`);
  }
  return json;
}

function buildProductName(params: {
  plan: PlanId;
  courseTitle?: string;
  isLiveCheckout: boolean;
  isVipMembership: boolean;
  isCourseCheckout: boolean;
}): string {
  if (params.isLiveCheckout) return `Accès live — ${params.courseTitle ?? "BelKou"}`;
  if (params.isVipMembership) return "BelKou VIP — Accès illimité";
  if (params.isCourseCheckout) return params.courseTitle ?? "Cours BelKou";
  return `BelKou ${params.plan === "premium" ? "Premium" : "VIP"}`;
}

function buildProductDescription(params: {
  plan: PlanId;
  isLiveCheckout: boolean;
  isVipMembership: boolean;
  isCourseCheckout: boolean;
}): string {
  if (params.isLiveCheckout) {
    return "Place réservée pour ce live BelKou : direct, commentaires et replay";
  }
  if (params.isVipMembership) return "Tous les cours et tous les lives BelKou, à vie";
  if (params.isCourseCheckout) return "Accès complet au cours BelKou";
  return params.plan === "vip"
    ? "Tous les cours et tous les lives BelKou, à vie"
    : "Formation BelKou — formation en ligne";
}

function resolveAmountCents(params: {
  plan: PlanId;
  amountUsd?: number;
  isLiveCheckout: boolean;
  isVipMembership: boolean;
  isCourseCheckout: boolean;
}): number {
  if (params.isLiveCheckout) {
    return Math.round((params.amountUsd ?? LIVE_TICKET_PRICE_USD) * 100);
  }
  if (params.isVipMembership) {
    return Math.round(siteConfig.plans.vip.price * 100);
  }
  if (params.isCourseCheckout) {
    return Math.round((params.amountUsd ?? 0) * 100);
  }
  if (params.plan === "premium") {
    return Math.round((params.amountUsd ?? siteConfig.plans.premium.price) * 100);
  }
  return Math.round(siteConfig.plans.vip.price * 100);
}

/** Create a Square-hosted Payment Link and return a checkout-session-shaped object. */
export async function createPaymentLink(params: {
  registrationId: string;
  plan: PlanId;
  email: string;
  fullName: string;
  courseSlug?: string;
  courseTitle?: string;
  amountUsd?: number;
}): Promise<SquareCheckoutSession | null> {
  const env = await getServerEnvResolved();
  if (!env.SQUARE_ACCESS_TOKEN || !env.SQUARE_LOCATION_ID) return null;

  const isLiveCheckout = params.plan === "live";
  const isVipMembership = params.plan === "vip";
  const isCourseCheckout =
    Boolean(params.courseSlug && params.amountUsd != null) && !isLiveCheckout && !isVipMembership;

  const amountCents = resolveAmountCents({
    plan: params.plan,
    amountUsd: params.amountUsd,
    isLiveCheckout,
    isVipMembership,
    isCourseCheckout,
  });

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

  const redirectUrl = new URL(`${env.SITE_URL}/success`);
  redirectUrl.searchParams.set("registrationId", params.registrationId);
  redirectUrl.searchParams.set("plan", params.plan);

  const metadata: Record<string, string> = {
    registrationId: params.registrationId,
    plan: params.plan,
    fullName: params.fullName,
    expectedCurrency: "USD",
    expectedAmountCents: String(amountCents),
    cancelUrl,
    ...(params.courseSlug ? { courseSlug: params.courseSlug } : {}),
  };

  const name = buildProductName({
    plan: params.plan,
    courseTitle: params.courseTitle,
    isLiveCheckout,
    isVipMembership,
    isCourseCheckout,
  });
  const description = buildProductDescription({
    plan: params.plan,
    isLiveCheckout,
    isVipMembership,
    isCourseCheckout,
  });

  const body = {
    idempotency_key: `belkou-${params.registrationId}-${Date.now()}`,
    description: `BelKou ${params.plan}`,
    order: {
      location_id: env.SQUARE_LOCATION_ID,
      reference_id: params.registrationId.slice(0, 40),
      metadata,
      line_items: [
        {
          name: name.slice(0, 512),
          quantity: "1",
          note: description.slice(0, 500),
          base_price_money: {
            amount: amountCents,
            currency: "USD",
          },
        },
      ],
    },
    checkout_options: {
      redirect_url: redirectUrl.toString(),
      ask_for_shipping_address: false,
    },
    pre_populated_data: {
      buyer_email: params.email,
    },
    payment_note: `BelKou registration ${params.registrationId}`,
  };

  const result = await squareFetch<{
    payment_link?: { id?: string; order_id?: string; url?: string };
  }>("/v2/online-checkout/payment-links", {
    method: "POST",
    body: JSON.stringify(body),
    accessToken: env.SQUARE_ACCESS_TOKEN,
    environment: env.SQUARE_ENVIRONMENT,
  });

  const orderId = result.payment_link?.order_id?.trim();
  const url = result.payment_link?.url?.trim() ?? null;
  if (!orderId || !url) return null;

  return {
    id: orderId,
    url,
    payment_status: "unpaid",
    mode: "payment",
    amount_total: amountCents,
    currency: "usd",
    customer_email: params.email,
    customer_details: { email: params.email },
    total_details: { amount_discount: 0 },
    metadata,
  };
}

type SquareOrder = {
  id?: string;
  reference_id?: string | null;
  metadata?: Record<string, string> | null;
  state?: string | null;
  total_money?: { amount?: number; currency?: string } | null;
  tenders?: Array<{
    id?: string;
    type?: string;
    amount_money?: { amount?: number; currency?: string };
  }> | null;
};

type SquarePayment = {
  id?: string;
  status?: string | null;
  order_id?: string | null;
  amount_money?: { amount?: number; currency?: string } | null;
  buyer_email_address?: string | null;
  total_money?: { amount?: number; currency?: string } | null;
};

function orderToCheckoutSession(
  order: SquareOrder,
  opts?: { payment?: SquarePayment | null; paid?: boolean },
): SquareCheckoutSession {
  const metadata: Record<string, string> = { ...(order.metadata ?? {}) };
  if (!metadata.registrationId && order.reference_id) {
    metadata.registrationId = order.reference_id;
  }

  const amount =
    opts?.payment?.total_money?.amount ??
    opts?.payment?.amount_money?.amount ??
    order.total_money?.amount ??
    null;
  const currency =
    opts?.payment?.total_money?.currency ??
    opts?.payment?.amount_money?.currency ??
    order.total_money?.currency ??
    "USD";

  const paid =
    opts?.paid === true ||
    opts?.payment?.status === "COMPLETED" ||
    order.state === "COMPLETED" ||
    (order.tenders?.length ?? 0) > 0;

  return {
    id: order.id ?? "",
    url: null,
    payment_status: paid ? "paid" : "unpaid",
    mode: "payment",
    amount_total: typeof amount === "number" ? amount : null,
    currency: currency?.toLowerCase() ?? "usd",
    customer_email: opts?.payment?.buyer_email_address ?? null,
    customer_details: opts?.payment?.buyer_email_address
      ? { email: opts.payment.buyer_email_address }
      : null,
    total_details: { amount_discount: 0 },
    metadata,
  };
}

export async function getCheckoutSession(orderId: string): Promise<SquareCheckoutSession | null> {
  const env = await getServerEnvResolved();
  if (!env.SQUARE_ACCESS_TOKEN || !orderId.trim()) return null;

  const orderRes = await squareFetch<{ order?: SquareOrder }>(
    `/v2/orders/${encodeURIComponent(orderId)}`,
    {
      method: "GET",
      accessToken: env.SQUARE_ACCESS_TOKEN,
      environment: env.SQUARE_ENVIRONMENT,
    },
  );
  if (!orderRes.order?.id) return null;

  let payment: SquarePayment | null = null;
  try {
    const paymentsRes = await squareFetch<{ payments?: SquarePayment[] }>(
      `/v2/payments?order_id=${encodeURIComponent(orderId)}`,
      {
        method: "GET",
        accessToken: env.SQUARE_ACCESS_TOKEN,
        environment: env.SQUARE_ENVIRONMENT,
      },
    );
    payment =
      paymentsRes.payments?.find((p) => p.status === "COMPLETED") ??
      paymentsRes.payments?.[0] ??
      null;
  } catch {
    /* order alone may already show tenders */
  }

  return orderToCheckoutSession(orderRes.order, { payment });
}

export async function getPayment(paymentId: string): Promise<SquarePayment | null> {
  const env = await getServerEnvResolved();
  if (!env.SQUARE_ACCESS_TOKEN || !paymentId.trim()) return null;
  const res = await squareFetch<{ payment?: SquarePayment }>(
    `/v2/payments/${encodeURIComponent(paymentId)}`,
    {
      method: "GET",
      accessToken: env.SQUARE_ACCESS_TOKEN,
      environment: env.SQUARE_ENVIRONMENT,
    },
  );
  return res.payment ?? null;
}

export async function checkoutSessionFromPayment(
  payment: SquarePayment,
): Promise<SquareCheckoutSession | null> {
  if (!payment.order_id) return null;
  const env = await getServerEnvResolved();
  if (!env.SQUARE_ACCESS_TOKEN) return null;

  const orderRes = await squareFetch<{ order?: SquareOrder }>(
    `/v2/orders/${encodeURIComponent(payment.order_id)}`,
    {
      method: "GET",
      accessToken: env.SQUARE_ACCESS_TOKEN,
      environment: env.SQUARE_ENVIRONMENT,
    },
  );
  if (!orderRes.order?.id) return null;
  return orderToCheckoutSession(orderRes.order, {
    payment,
    paid: payment.status === "COMPLETED",
  });
}

function timingSafeEqualBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * Verify Square webhook signature.
 * signature = Base64(HMAC-SHA256(notificationUrl + body, signatureKey))
 */
export async function verifyWebhook(
  body: string,
  signatureHeader: string,
  notificationUrl: string,
): Promise<{
  type: string;
  event_id: string;
  data: { type?: string; id?: string; object?: { payment?: SquarePayment } };
}> {
  const env = await getServerEnvResolved();
  if (!env.SQUARE_WEBHOOK_SIGNATURE_KEY) {
    throw new Error("Square webhook not configured");
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(env.SQUARE_WEBHOOK_SIGNATURE_KEY),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(notificationUrl + body),
  );
  const expected = new Uint8Array(mac);
  const received = base64ToBytes(signatureHeader);
  if (!timingSafeEqualBytes(expected, received)) {
    throw new Error("Invalid Square webhook signature");
  }

  return JSON.parse(body) as {
    type: string;
    event_id: string;
    data: { type?: string; id?: string; object?: { payment?: SquarePayment } };
  };
}
