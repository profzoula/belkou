import { getServerEnvResolved } from "@/server/env";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail({ to, subject, html }: SendEmailInput) {
  const env = await getServerEnvResolved();

  if (!env.RESEND_API_KEY) {
    console.info("[BelKou] Email (dev mode):", { to, subject });
    return { ok: true as const, dev: true };
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
    throw new Error(`Email failed: ${text}`);
  }

  return { ok: true as const, dev: false };
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

export function paymentConfirmedEmail(name: string, plan: string, whatsappUrl: string, cohortDate: string) {
  const groupLabel = plan === "vip" ? "VIP VibeCode" : "Premium VibeCode";
  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111;">
      <h1 style="font-size:22px;">Paiement confirmé — merci ${name} !</h1>
      <p>Votre plan <strong>${plan.toUpperCase()}</strong> est activé. Début de la formation : <strong>${cohortDate}</strong>.</p>
      ${
        whatsappUrl
          ? `<p><a href="${whatsappUrl}" style="display:inline-block;background:#25D366;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;">Rejoindre ${groupLabel} sur WhatsApp</a></p>`
          : "<p>Nous vous enverrons le lien WhatsApp très bientôt.</p>"
      }
    </div>
  `;
}
