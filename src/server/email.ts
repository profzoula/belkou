import { getServerEnvResolved } from "@/server/env";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

export type SendEmailResult =
  | { ok: true; dev: boolean }
  | { ok: false; reason: "not_configured" | "send_failed"; message?: string };

export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<SendEmailResult> {
  const env = await getServerEnvResolved();
  const isProd = process.env.NODE_ENV === "production";

  if (!env.RESEND_API_KEY) {
    // Dev: log only. Production: fail closed so callers don't assume delivery.
    console.warn("[BelKou] Email skipped — RESEND_API_KEY missing:", { to, subject, isProd });
    if (isProd) {
      return {
        ok: false,
        reason: "not_configured",
        message: "RESEND_API_KEY manquant — email non envoyé.",
      };
    }
    console.info("[BelKou] Email (dev mode):", { to, subject });
    return { ok: true, dev: true };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[BelKou] Email failed:", text);
    return { ok: false, reason: "send_failed", message: text };
  }

  return { ok: true, dev: false };
}

export function registrationPendingEmail(params: {
  name: string;
  plan: string;
  price: number;
  registrationId: string;
  checkoutUrl?: string | null;
  manualPaymentHtml: string;
}) {
  const paymentBlock = params.checkoutUrl
    ? `<p><a href="${params.checkoutUrl}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;">Payer maintenant — $${params.price}</a></p>`
    : `<div style="background:#f4f4f5;padding:16px;border-radius:8px;margin:16px 0;">${params.manualPaymentHtml}</div>`;

  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111;">
      <h1 style="font-size:22px;">Bienvenue sur BelKou, ${params.name} !</h1>
      <p>Nous avons bien reçu votre inscription pour le plan <strong>${params.plan.toUpperCase()}</strong> ($${params.price} USD).</p>
      ${paymentBlock}
      <p>Après le paiement, vous recevrez le lien du groupe WhatsApp et les détails sur la formation.</p>
      <p style="color:#666;font-size:13px;">ID d'inscription : ${params.registrationId}</p>
    </div>
  `;
}

export function paymentConfirmedEmail(name: string, plan: string, whatsappUrl: string) {
  const groupLabel = plan === "vip" ? "VIP VibeCode" : "Premium VibeCode";
  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111;">
      <h1 style="font-size:22px;">Paiement confirmé — merci ${name} !</h1>
      <p>Votre plan <strong>${plan.toUpperCase()}</strong> est activé. Accédez à vos cours depuis votre espace BelKou.</p>
      ${
        whatsappUrl
          ? `<p><a href="${whatsappUrl}" style="display:inline-block;background:#25D366;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;">Rejoindre ${groupLabel} sur WhatsApp</a></p>`
          : "<p>Nous vous enverrons le lien WhatsApp très bientôt.</p>"
      }
    </div>
  `;
}

export function serviceBookingEmail(params: {
  serviceTitle: string;
  name: string;
  email: string;
  phone: string;
  preferredDate: string;
  preferredTime: string;
  message?: string;
}) {
  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111;">
      <h1 style="font-size:20px;">Nouvelle demande de rendez-vous</h1>
      <p><strong>Service :</strong> ${params.serviceTitle}</p>
      <ul style="line-height:1.6;padding-left:18px;">
        <li><strong>Nom :</strong> ${params.name}</li>
        <li><strong>Email :</strong> ${params.email}</li>
        <li><strong>Téléphone :</strong> ${params.phone}</li>
        <li><strong>Date préférée :</strong> ${params.preferredDate}</li>
        <li><strong>Heure préférée :</strong> ${params.preferredTime}</li>
      </ul>
      ${
        params.message?.trim()
          ? `<p><strong>Message :</strong><br/>${params.message.replace(/\n/g, "<br/>")}</p>`
          : ""
      }
    </div>
  `;
}
