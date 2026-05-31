import { z } from "zod";

const envSchema = z.object({
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("BelKou <noreply@belkou.fr>"),
  SITE_URL: z.string().default("https://belkou.online"),
  STRIPE_PRICE_PREMIUM: z.string().optional(),
  STRIPE_PRICE_VIP: z.string().optional(),
});

export type ServerEnv = z.infer<typeof envSchema>;

function fromProcessEnv(): Record<string, string | undefined> {
  return {
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    SITE_URL: process.env.SITE_URL ?? process.env.VITE_SITE_URL,
    STRIPE_PRICE_PREMIUM: process.env.STRIPE_PRICE_PREMIUM ?? process.env.VITE_STRIPE_PRICE_PREMIUM,
    STRIPE_PRICE_VIP: process.env.STRIPE_PRICE_VIP ?? process.env.VITE_STRIPE_PRICE_VIP,
  };
}

export function getServerEnv(): ServerEnv {
  return envSchema.parse(fromProcessEnv());
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
    });
  }
  return getServerEnv();
}
