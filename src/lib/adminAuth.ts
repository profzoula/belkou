import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

async function signToken(username: string): Promise<string> {
  const { createHmac } = await import("node:crypto");
  const secret = process.env.ADMIN_SESSION_SECRET ?? "dev-secret";
  const payload = `${username}|${Date.now()}`;
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return Buffer.from(`${payload}|${sig}`).toString("base64url");
}

async function verifyTokenInternal(token: string): Promise<string | null> {
  const { createHmac, timingSafeEqual } = await import("node:crypto");
  try {
    const decoded = Buffer.from(token, "base64url").toString();
    const parts = decoded.split("|");
    if (parts.length !== 3) return null;
    const [username, ts, sig] = parts;
    const secret = process.env.ADMIN_SESSION_SECRET ?? "dev-secret";
    const payload = `${username}|${ts}`;
    const expected = createHmac("sha256", secret).update(payload).digest("hex");
    const sigBuf = Buffer.from(sig, "hex");
    const expBuf = Buffer.from(expected, "hex");
    if (sigBuf.length !== expBuf.length) return null;
    if (!timingSafeEqual(sigBuf, expBuf)) return null;
    return username;
  } catch {
    return null;
  }
}

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ username: z.string(), password: z.string() }).parse(data),
  )
  .handler(async ({ data }) => {
    const { createHash } = await import("node:crypto");
    const CRED_HASH = "d8244deb66b69482f4e73e6a16f086763c5f9b7f65f8a136949ca4cda668ffe2";
    const inputHash = createHash("sha256")
      .update(`${data.username.trim()}:${data.password.trim()}`)
      .digest("hex");
    if (inputHash === CRED_HASH) {
      const token = await signToken(data.username.trim());
      return { success: true as const, token };
    }
    return { success: false as const, token: null };
  });

export const checkAdminToken = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ token: z.string() }).parse(data),
  )
  .handler(async ({ data }) => {
    const user = await verifyTokenInternal(data.token);
    return { valid: !!user, username: user ?? null };
  });

export const getRegistrations = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ token: z.string() }).parse(data),
  )
  .handler(async ({ data }) => {
    const user = await verifyTokenInternal(data.token);
    if (!user) throw new Error("Unauthorized");

    const { getSupabaseAdmin } = await import("./supabaseAdmin");
    const admin = getSupabaseAdmin();

    const { data: rows, error } = await admin
      .from("registrations")
      .select("*")
      .order("id", { ascending: false });

    if (error) throw new Error(error.message);
    return (rows ?? []) as Array<{
      id: number;
      full_name: string;
      email: string;
      whatsapp: string;
      country: string;
      level: string;
      plan: string;
      created_at: string;
    }>;
  });

export const deleteRegistration = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ token: z.string(), id: z.number() }).parse(data),
  )
  .handler(async ({ data }) => {
    const user = await verifyTokenInternal(data.token);
    if (!user) throw new Error("Unauthorized");

    const { getSupabaseAdmin } = await import("./supabaseAdmin");
    const admin = getSupabaseAdmin();

    const { error } = await admin.from("registrations").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true as const };
  });
