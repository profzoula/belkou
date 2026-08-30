import { z } from "zod";

const envSchema = z.object({
  SQUARE_ACCESS_TOKEN: z.string().optional(),
  SQUARE_LOCATION_ID: z.string().optional(),
  SQUARE_ENVIRONMENT: z.enum(["sandbox", "production"]).default("sandbox"),
  SQUARE_WEBHOOK_SIGNATURE_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("BelKou <noreply@belkou.online>"),
  SITE_URL: z.string().default("https://belkou.online"),
  ADMIN_USERNAME: z.string().optional(),
  ADMIN_PASSWORD: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  OPS_ALERT_WEBHOOK_URL: z.string().optional(),
});

export type ServerEnv = z.infer<typeof envSchema>;

function fromProcessEnv(): Record<string, string | undefined> {
  const squareEnv = process.env.SQUARE_ENVIRONMENT?.trim().toLowerCase();
  return {
    SQUARE_ACCESS_TOKEN: process.env.SQUARE_ACCESS_TOKEN?.trim(),
    SQUARE_LOCATION_ID: process.env.SQUARE_LOCATION_ID?.trim(),
    SQUARE_ENVIRONMENT: squareEnv === "production" ? "production" : squareEnv === "sandbox" ? "sandbox" : undefined,
    SQUARE_WEBHOOK_SIGNATURE_KEY: process.env.SQUARE_WEBHOOK_SIGNATURE_KEY?.trim(),
    RESEND_API_KEY: process.env.RESEND_API_KEY?.trim(),
    EMAIL_FROM: process.env.EMAIL_FROM?.trim(),
    SITE_URL: (process.env.SITE_URL ?? process.env.VITE_SITE_URL)?.trim(),
    ADMIN_USERNAME: process.env.ADMIN_USERNAME?.trim(),
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD?.trim(),
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
    OPS_ALERT_WEBHOOK_URL: process.env.OPS_ALERT_WEBHOOK_URL?.trim(),
  };
}

export function getServerEnv(): ServerEnv {
  const parsed = envSchema.parse(fromProcessEnv());
  logMissingProductionEnv(parsed);
  return parsed;
}

const PRODUCTION_ENV_CHECKS = [
  { key: "SUPABASE_SERVICE_ROLE_KEY", label: "Supabase service role" },
  { key: "SQUARE_ACCESS_TOKEN", label: "Square access token" },
  { key: "SQUARE_LOCATION_ID", label: "Square location id" },
  { key: "SQUARE_WEBHOOK_SIGNATURE_KEY", label: "Square webhook signature key" },
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
    const squareEnv = cf.SQUARE_ENVIRONMENT?.trim().toLowerCase();
    return envSchema.parse({
      SQUARE_ACCESS_TOKEN: cf.SQUARE_ACCESS_TOKEN,
      SQUARE_LOCATION_ID: cf.SQUARE_LOCATION_ID,
      SQUARE_ENVIRONMENT: squareEnv === "production" ? "production" : "sandbox",
      SQUARE_WEBHOOK_SIGNATURE_KEY: cf.SQUARE_WEBHOOK_SIGNATURE_KEY,
      RESEND_API_KEY: cf.RESEND_API_KEY,
      EMAIL_FROM: cf.EMAIL_FROM,
      SITE_URL: cf.SITE_URL,
      ADMIN_USERNAME: cf.ADMIN_USERNAME,
      ADMIN_PASSWORD: cf.ADMIN_PASSWORD,
      SUPABASE_SERVICE_ROLE_KEY: cf.SUPABASE_SERVICE_ROLE_KEY,
      OPS_ALERT_WEBHOOK_URL: cf.OPS_ALERT_WEBHOOK_URL,
    });
  }
  return getServerEnv();
}
