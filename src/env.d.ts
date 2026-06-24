/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CONTACT_EMAIL?: string;
  readonly VITE_WHATSAPP_GROUP_PREMIUM?: string;
  readonly VITE_WHATSAPP_GROUP_VIP?: string;
  readonly VITE_WHATSAPP_GROUP_URL?: string;
  readonly VITE_COHORT_START_DATE?: string;
  readonly VITE_STATS_STUDENTS_BASE?: string;
  readonly VITE_STRIPE_PRICE_PREMIUM?: string;
  readonly VITE_STRIPE_PRICE_VIP?: string;
  readonly VITE_MONCASH_NUMBER?: string;
  readonly VITE_ZELLE_EMAIL?: string;
  readonly VITE_PAYPAL_EMAIL?: string;
  readonly VITE_BANK_INSTRUCTIONS?: string;
  readonly VITE_TWITTER_HANDLE?: string;
  readonly VITE_SITE_URL?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_VIMEO_PREVIEW_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface CloudflareEnv {
  DB?: D1Database;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  SITE_URL?: string;
  STRIPE_PRICE_PREMIUM?: string;
  STRIPE_PRICE_VIP?: string;
  ADMIN_USERNAME?: string;
  ADMIN_PASSWORD?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}

declare module "cloudflare:workers" {
  export const env: CloudflareEnv;
}
