import { z } from "zod";

const envSchema = z.object({
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("BelKou <noreply@belkou.fr>"),
  SITE_URL: z.string().default("https://belkou.online"),
  STRIPE_PRICE_PREMIUM: z.string().optional(),
  STRIPE_PRICE_VIP: z.string().optional(),
  ADMIN_USERNAME: z.string().optional(),
  ADMIN_PASSWORD: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
});

export type ServerEnv = z.infer<typeof envSchema>;

function fromProcessEnv(): Record<string, string | undefined> {
  return {
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY?.trim(),
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET?.trim(),
    RESEND_API_KEY: process.env.RESEND_API_KEY?.trim(),
    EMAIL_FROM: process.env.EMAIL_FROM?.trim(),
    SITE_URL: (process.env.SITE_URL ?? process.env.VITE_SITE_URL)?.trim(),
    STRIPE_PRICE_PREMIUM: (process.env.STRIPE_PRICE_PREMIUM ?? process.env.VITE_STRIPE_PRICE_PREMIUM)?.trim(),
    STRIPE_PRICE_VIP: (process.env.STRIPE_PRICE_VIP ?? process.env.VITE_STRIPE_PRICE_VIP)?.trim(),
    ADMIN_USERNAME: process.env.ADMIN_USERNAME?.trim(),
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD?.trim(),
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  };
}

export function getServerEnv(): ServerEnv {
  const parsed = envSchema.parse(fromProcessEnv());
  logMissingProductionEnv(parsed);
  return parsed;
}

const PRODUCTION_ENV_CHECKS = [
  { key: "SUPABASE_SERVICE_ROLE_KEY", label: "Supabase service role" },
  { key: "STRIPE_SECRET_KEY", label: "Stripe secret key" },
  { key: "STRIPE_WEBHOOK_SECRET", label: "Stripe webhook secret" },
  { key: "RESEND_API_KEY", label: "Resend email API" },
  { key: "ADMIN_PASSWORD", label: "Admin password" },
] as const;

let envWarningLogged = false;

function logMissingProductionEnv(env: ServerEnv): void {
  if (envWarningLogged || process.env.NODE_ENV === "test") return;
  envWarningLogged = true;

  const missing = PRODUCTION_ENV_CHECKS.filter((check) => !String(env[check.key] ?? "").trim());
  if (!missing.length) return;

  console.warn(
    `[BelKou] Variables serveur manquantes: ${missing.map((item) => item.label).join(", ")}. Certaines fonctionnalités seront limitées.`,
  );
}

export async function getDb(): Promise<D1Database | null> {
  try {
    const { env } = await import("cloudflare:workers");
    return env.DB ?? null;
  } catch {
    return null;
  }
}

export async function getCloudflareEnv(): Promise<CloudflareEnv | null> {
  try {
    const { env } = await import("cloudflare:workers");
    return env;
  } catch {
    return null;
  }
}

export async function getServerEnvResolved(): Promise<ServerEnv> {
  const cf = await getCloudflareEnv();
  if (cf) {
    return envSchema.parse({
      STRIPE_SECRET_KEY: cf.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: cf.STRIPE_WEBHOOK_SECRET,
      RESEND_API_KEY: cf.RESEND_API_KEY,
      EMAIL_FROM: cf.EMAIL_FROM,
      SITE_URL: cf.SITE_URL,
      STRIPE_PRICE_PREMIUM: cf.STRIPE_PRICE_PREMIUM,
      STRIPE_PRICE_VIP: cf.STRIPE_PRICE_VIP,
      ADMIN_USERNAME: cf.ADMIN_USERNAME,
      ADMIN_PASSWORD: cf.ADMIN_PASSWORD,
      SUPABASE_SERVICE_ROLE_KEY: cf.SUPABASE_SERVICE_ROLE_KEY,
    });
  }
  return getServerEnv();
}
