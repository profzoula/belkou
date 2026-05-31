import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, setResponseHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import {
  adminCookieHeader,
  clearAdminCookieHeader,
  createAdminToken,
  getAdminFromRequest,
} from "@/lib/admin-auth";
import { getDb } from "@/server/env";
import { getRegistrationStats, listRegistrations } from "@/server/db";
import { getServerEnvResolved } from "@/server/env";

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

export const checkAdminSession = createServerFn({ method: "GET" }).handler(async () => {
  const env = await getServerEnvResolved();
  if (!env.ADMIN_PASSWORD) return { authenticated: false as const };
  const admin = await getAdminFromRequest(getRequestHeader("cookie") ?? null, env.ADMIN_PASSWORD);
  return { authenticated: Boolean(admin) };
});
