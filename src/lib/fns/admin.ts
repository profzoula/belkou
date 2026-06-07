import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, setResponseHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import {
  adminCookieHeader,
  clearAdminCookieHeader,
  createAdminToken,
  getAdminFromRequest,
} from "@/lib/admin-auth";
import { siteConfig, getWhatsappGroupUrl } from "@/lib/site-config";
import { getDb, getServerEnvResolved } from "@/server/env";
import { registrationSchema } from "@/lib/schemas/registration";
import {
  getRegistrationByEmail,
  getRegistrationById,
  getRegistrationStats,
  listRegistrations,
  saveRegistration,
  updateRegistrationGrant,
  updateRegistrationPayment,
} from "@/server/db";
import { paymentConfirmedEmail, sendEmail } from "@/server/email";
import { checkRateLimit, RATE_LIMITS } from "@/server/rate-limit";

async function sendPaymentConfirmed(
  fullName: string,
  email: string,
  plan: "premium" | "vip",
) {
  try {
    await sendEmail({
      to: email,
      subject: "Paiement confirmé — BelKou",
      html: paymentConfirmedEmail(
        fullName,
        plan,
        getWhatsappGroupUrl(plan),
        siteConfig.cohortStartDate,
      ),
    });
  } catch (error) {
    console.error("Payment confirmation email error:", error);
  }
}

function isSecureRequest(): boolean {
  return getRequestHeader("x-forwarded-proto") === "https" || process.env.NODE_ENV === "production";
}

async function requireAdmin(): Promise<void> {
  const env = await getServerEnvResolved();
  if (!env.ADMIN_PASSWORD) {
    throw new Error("Admin non configuré");
  }
  const admin = await getAdminFromRequest(getRequestHeader("cookie") ?? null, env.ADMIN_PASSWORD);
  if (!admin) {
    throw new Error("Non autorisé");
  }
}

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        username: z.string().trim().min(1),
        password: z.string().min(1),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const allowed = checkRateLimit(`admin-login:${data.username}`, RATE_LIMITS.adminLogin.limit, RATE_LIMITS.adminLogin.windowMs);
    if (!allowed) {
      throw new Error("Trop de tentatives. Veuillez réessayer dans quelques minutes.");
    }

    const env = await getServerEnvResolved();
    if (!env.ADMIN_USERNAME || !env.ADMIN_PASSWORD) {
      throw new Error("Admin non configuré sur le serveur");
    }

    if (data.username !== env.ADMIN_USERNAME || data.password !== env.ADMIN_PASSWORD) {
      throw new Error("Identifiants incorrects");
    }

    const token = await createAdminToken(data.username, env.ADMIN_PASSWORD);
    setResponseHeader("Set-Cookie", adminCookieHeader(token, isSecureRequest()));
    return { ok: true as const };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  setResponseHeader("Set-Cookie", clearAdminCookieHeader(isSecureRequest()));
  return { ok: true as const };
});

export const getAdminDashboard = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const db = await getDb();
  const [registrations, stats] = await Promise.all([
    listRegistrations(db),
    getRegistrationStats(db),
  ]);

  return {
    stats,
    registrations: registrations.map((r) => ({
      id: r.id,
      full_name: r.full_name,
      email: r.email,
      whatsapp: r.whatsapp,
      country: r.country,
      level: r.level,
      plan: r.plan,
      payment_status: r.payment_status,
      created_at: r.created_at,
    })),
  };
});

export const adminAddCashRegistration = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        registration: registrationSchema,
        sendEmail: z.boolean().optional().default(true),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const db = await getDb();

    const existing = await getRegistrationByEmail(db, data.registration.email);
    if (existing) {
      throw new Error(
        "Cet email est déjà inscrit. Utilisez « Marquer payé » sur l'inscription existante.",
      );
    }

    const record = await saveRegistration(db, data.registration, { payment_status: "paid" });

    if (data.sendEmail) {
      await sendPaymentConfirmed(record.full_name, record.email, record.plan);
    }

    return {
      ok: true as const,
      registration: {
        id: record.id,
        email: record.email,
        full_name: record.full_name,
        plan: record.plan,
        payment_status: record.payment_status,
      },
    };
  });

export const adminMarkCashPaid = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        registrationId: z.string().min(1),
        sendEmail: z.boolean().optional().default(true),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const db = await getDb();
    const record = await getRegistrationById(db, data.registrationId);

    if (!record) {
      throw new Error("Inscription introuvable");
    }

    if (record.payment_status === "paid") {
      throw new Error("Cette inscription est déjà marquée comme payée");
    }

    await updateRegistrationPayment(db, record.id, { payment_status: "paid" });

    if (data.sendEmail) {
      await sendPaymentConfirmed(record.full_name, record.email, record.plan);
    }

    const { earnAffiliateCommission } = await import("@/server/affiliates");
    await earnAffiliateCommission(record.id);

    return { ok: true as const };
  });

export const adminGrantFreeVip = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        registrationId: z.string().min(1).optional(),
        email: z.string().email().optional(),
        sendEmail: z.boolean().optional().default(true),
      })
      .refine((d) => d.registrationId || d.email, {
        message: "registrationId ou email requis",
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const db = await getDb();

    const record = data.registrationId
      ? await getRegistrationById(db, data.registrationId)
      : await getRegistrationByEmail(db, data.email!);

    if (!record) {
      throw new Error("Inscription introuvable");
    }

    const updated = await updateRegistrationGrant(db, record.id, {
      plan: "vip",
      payment_status: "paid",
    });

    if (!updated) {
      throw new Error("Mise à jour impossible");
    }

    if (data.sendEmail) {
      await sendPaymentConfirmed(updated.full_name, updated.email, "vip");
    }

    const { earnAffiliateCommission } = await import("@/server/affiliates");
    await earnAffiliateCommission(updated.id);

    return {
      ok: true as const,
      registration: {
        id: updated.id,
        email: updated.email,
        full_name: updated.full_name,
        plan: updated.plan,
        payment_status: updated.payment_status,
      },
    };
  });

export const getAdminAffiliateOverview = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const { getAdminAffiliateOverview: loadOverview } = await import("@/server/affiliates");
  return loadOverview();
});

export const adminProcessWithdrawal = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        withdrawalId: z.string().min(1),
        action: z.enum(["paid", "rejected"]),
        adminNote: z.string().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { processWithdrawal } = await import("@/server/affiliate-withdrawals");
    const result = await processWithdrawal({
      withdrawalId: data.withdrawalId,
      action: data.action,
      adminNote: data.adminNote,
    });

    if (!result.ok) {
      throw new Error(
        result.reason === "not_found"
          ? "Demande introuvable ou déjà traitée"
          : "Impossible de traiter la demande",
      );
    }

    return { ok: true as const };
  });

export const checkAdminSession = createServerFn({ method: "GET" }).handler(async () => {
  const env = await getServerEnvResolved();
  if (!env.ADMIN_PASSWORD) return { authenticated: false as const };
  const admin = await getAdminFromRequest(getRequestHeader("cookie") ?? null, env.ADMIN_PASSWORD);
  return { authenticated: Boolean(admin) };
});
