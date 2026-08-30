import { createHmac, timingSafeEqual } from "node:crypto";
import { getServerEnv } from "@/server/env";

type ExamAccessPayload = {
  slug: string;
  email: string;
  exp: number;
};

function secret(): string {
  const env = getServerEnv();
  return (
    env.SUPABASE_SERVICE_ROLE_KEY ||
    env.ADMIN_PASSWORD ||
    env.SQUARE_WEBHOOK_SIGNATURE_KEY ||
    "belkou-dev-exam-ebook"
  );
}

function b64url(input: Buffer | string): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input, "utf8");
  return buf.toString("base64url");
}

function sign(payloadB64: string): string {
  return createHmac("sha256", secret()).update(payloadB64).digest("base64url");
}

/** Short-lived token so the browser can load the HTML via iframe src (not srcDoc). */
export function createExamEbookAccessToken(params: {
  courseSlug: string;
  email: string;
  ttlSeconds?: number;
}): string {
  const payload: ExamAccessPayload = {
    slug: params.courseSlug,
    email: params.email.trim().toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + (params.ttlSeconds ?? 60 * 30),
  };
  const payloadB64 = b64url(JSON.stringify(payload));
  return `${payloadB64}.${sign(payloadB64)}`;
}

export function verifyExamEbookAccessToken(
  token: string,
  expectedSlug: string,
): { ok: true; email: string } | { ok: false; reason: string } {
  const [payloadB64, signature] = token.split(".");
  if (!payloadB64 || !signature) return { ok: false, reason: "token_invalid" };

  const expected = sign(payloadB64);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: "token_signature" };
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8")) as ExamAccessPayload;
    if (payload.slug !== expectedSlug) return { ok: false, reason: "token_slug" };
    if (!payload.email || typeof payload.exp !== "number") {
      return { ok: false, reason: "token_payload" };
    }
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return { ok: false, reason: "token_expired" };
    }
    return { ok: true, email: payload.email };
  } catch {
    return { ok: false, reason: "token_parse" };
  }
}
