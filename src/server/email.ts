import { getServerEnvResolved } from "@/server/env";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

export type PaymentInvoiceDetails = {
  invoiceId: string;
  itemLabel: string;
  amountUsd: number;
  currency?: string;
  paidAtIso?: string;
  transactionId?: string;
  customerEmail?: string;
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

/** Resend caps a batch at 100 messages; batching also keeps us under the Workers subrequest limit. */
const RESEND_BATCH_SIZE = 100;

export async function sendEmailBatch(
  messages: SendEmailInput[],
): Promise<{ sent: number; failed: number }> {
  if (messages.length === 0) return { sent: 0, failed: 0 };

  const env = await getServerEnvResolved();
  const isProd = process.env.NODE_ENV === "production";

  if (!env.RESEND_API_KEY) {
    console.warn("[BelKou] Batch email skipped — RESEND_API_KEY missing:", {
      count: messages.length,
      isProd,
    });
    return isProd ? { sent: 0, failed: messages.length } : { sent: messages.length, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  for (let index = 0; index < messages.length; index += RESEND_BATCH_SIZE) {
    const chunk = messages.slice(index, index + RESEND_BATCH_SIZE);
    try {
      const res = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          chunk.map((message) => ({
            from: env.EMAIL_FROM,
            to: [message.to],
            subject: message.subject,
            html: message.html,
          })),
        ),
      });

      if (res.ok) {
        sent += chunk.length;
      } else {
        failed += chunk.length;
        console.error("[BelKou] Batch email failed:", await res.text());
      }
    } catch (error) {
      failed += chunk.length;
      console.error("[BelKou] Batch email threw:", error);
    }
  }

  return { sent, failed };
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

function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatInvoiceDate(iso?: string): string {
  const raw = iso || new Date().toISOString();
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return new Date().toLocaleString("fr-FR");
  return date.toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
}

export type LiveEventEmailDetails = {
  title: string;
  scheduledAt: string;
  url: string;
};

/** Haiti time with its zone, so a reader abroad cannot misread the hour. */
function formatLiveEmailDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Port-au-Prince",
      timeZoneName: "short",
    });
  } catch {
    return iso;
  }
}

export function paymentConfirmedEmail(
  name: string,
  plan: string,
  whatsappUrl: string,
  invoice?: PaymentInvoiceDetails,
  liveEvent?: LiveEventEmailDetails,
) {
  const groupLabel = "Formation VibeCode";
  const liveBlock = liveEvent
    ? `
      <div style="margin:18px 0;border:1px solid #e4e4e7;border-radius:10px;padding:14px 16px;">
        <h2 style="font-size:16px;margin:0 0 6px;">${liveEvent.title}</h2>
        <p style="margin:0 0 4px;font-size:15px;"><strong>${formatLiveEmailDate(liveEvent.scheduledAt)}</strong></p>
        <p style="margin:0 0 12px;font-size:13px;color:#52525b;">Heure d'Haïti. Ouvrez la page du live : elle bascule sur le direct toute seule au démarrage.</p>
        <p style="margin:0;"><a href="${liveEvent.url}" style="display:inline-block;background:#111;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600;">Voir mon live</a></p>
      </div>
    `
    : "";
  const invoiceBlock = invoice
    ? `
      <div style="margin:18px 0;border:1px solid #e4e4e7;border-radius:10px;padding:14px 16px;background:#fafafa;">
        <h2 style="font-size:16px;margin:0 0 10px;">Facture d'achat</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;line-height:1.45;">
          <tr><td style="padding:4px 0;color:#52525b;">N° facture</td><td style="padding:4px 0;text-align:right;"><strong>${invoice.invoiceId}</strong></td></tr>
          <tr><td style="padding:4px 0;color:#52525b;">Article</td><td style="padding:4px 0;text-align:right;">${invoice.itemLabel}</td></tr>
          <tr><td style="padding:4px 0;color:#52525b;">Montant payé</td><td style="padding:4px 0;text-align:right;"><strong>${formatCurrency(invoice.amountUsd, (invoice.currency ?? "USD").toUpperCase())}</strong></td></tr>
          <tr><td style="padding:4px 0;color:#52525b;">Date de paiement</td><td style="padding:4px 0;text-align:right;">${formatInvoiceDate(invoice.paidAtIso)}</td></tr>
          ${
            invoice.transactionId
              ? `<tr><td style="padding:4px 0;color:#52525b;">Réf. transaction</td><td style="padding:4px 0;text-align:right;">${invoice.transactionId}</td></tr>`
              : ""
          }
          ${
            invoice.customerEmail
              ? `<tr><td style="padding:4px 0;color:#52525b;">Client</td><td style="padding:4px 0;text-align:right;">${invoice.customerEmail}</td></tr>`
              : ""
          }
        </table>
      </div>
    `
    : "";

  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111;">
      <h1 style="font-size:22px;">Paiement confirmé — merci ${name} !</h1>
      <p>${
        plan === "live"
          ? "Votre place est réservée. Connectez-vous sur BelKou avec ce même email le jour du direct — le replay reste disponible après la session."
          : `Votre plan <strong>${plan.toUpperCase()}</strong> est activé. Accédez à vos cours depuis votre espace BelKou.`
      }</p>
      ${liveBlock}
      ${invoiceBlock}
      ${
        whatsappUrl
          ? `<p><a href="${whatsappUrl}" style="display:inline-block;background:#25D366;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;">Rejoindre ${groupLabel} sur WhatsApp</a></p>`
          : "<p>Nous vous enverrons le lien WhatsApp très bientôt.</p>"
      }
    </div>
  `;
}

/** Manual reminder an admin fires before an event, to everyone holding a seat. */
export function liveReminderEmail(params: {
  name: string;
  title: string;
  scheduledAt: string;
  url: string;
  note?: string;
}) {
  const firstName = params.name.trim().split(/\s+/)[0] || "";
  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111;">
      <h1 style="font-size:20px;">Rappel — ${params.title}</h1>
      <p>${firstName ? `Bonjour ${firstName}, v` : "V"}otre place est réservée.</p>
      <div style="margin:18px 0;border:1px solid #e4e4e7;border-radius:10px;padding:14px 16px;">
        <p style="margin:0 0 4px;font-size:15px;"><strong>${formatLiveEmailDate(params.scheduledAt)}</strong></p>
        <p style="margin:0 0 12px;font-size:13px;color:#52525b;">Heure d'Haïti. Ouvrez la page du live : elle bascule sur le direct toute seule au démarrage.</p>
        <p style="margin:0;"><a href="${params.url}" style="display:inline-block;background:#111;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600;">Rejoindre le live</a></p>
      </div>
      ${params.note?.trim() ? `<p style="white-space:pre-line;">${params.note.trim()}</p>` : ""}
      <p style="font-size:13px;color:#52525b;">Si vous ne pouvez pas suivre en direct, le replay reste disponible sur la même page.</p>
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
