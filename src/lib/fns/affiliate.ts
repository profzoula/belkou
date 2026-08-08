import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  AFFILIATE_COMMISSION_USD,
  AFFILIATE_MIN_WITHDRAWAL_USD,
  AFFILIATE_SIGNUP_COMMISSION_USD,
} from "@/lib/affiliate-config";
import { affiliateCodeForUser } from "@/lib/affiliate-code";
import { normalizeRegistrationEmail } from "@/lib/schemas/registration";
import { requestAffiliateWithdrawal } from "@/server/affiliate-withdrawals";
import { getUserFromAccessToken } from "@/server/supabase-auth";
import {
  areAffiliateTablesReady,
  claimSignupReferralFromTrustedSources,
  getAffiliateByCode,
  getAffiliateStats,
  getOrCreateAffiliate,
  persistAffiliate,
} from "@/server/affiliates";
import { getServerEnvResolved } from "@/server/env";
import { getSupabaseAdmin } from "@/server/supabase-registrations";

export const getAffiliateDashboard = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        accessToken: z.string().min(1),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const user = await getUserFromAccessToken(data.accessToken);
    if (!user?.email || !user.id) {
      return { affiliate: null, error: "not_authenticated" as const };
    }

    const email = normalizeRegistrationEmail(user.email);
    const fullName =
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      user.email.split("@")[0];

    const affiliateRecord = await getOrCreateAffiliate({
      userId: user.id,
      email,
      fullName,
    }).catch((err) => {
      console.warn("[BelKou] getOrCreateAffiliate:", err);
      return null;
    });

    // Always prefer DB code, then metadata/deterministic fallback (same algorithm).
    const code = affiliateRecord?.code ?? affiliateCodeForUser(user);

    await persistAffiliate({
      userId: user.id,
      email,
      fullName,
      code,
    }).catch((err) => console.warn("[BelKou] persist affiliate:", err));

    // Signup claim uses referred_by metadata only — never client localStorage.
    const tablesReady = await areAffiliateTablesReady();

    const claimResult = await claimSignupReferralFromTrustedSources({
      userId: user.id,
      email,
      createdAt: user.created_at,
    }).catch((err) => {
      console.warn("[BelKou] claim signup referral:", err);
      return { ok: false as const, reason: "error" };
    });
    if (!claimResult.ok && claimResult.reason === "tables_unavailable") {
      console.error(
        "[BelKou] Affiliate tables missing — run migrations/supabase_affiliates.sql in Supabase",
      );
    }

    const stats = await getAffiliateStats(
      affiliateRecord?.id ?? user.id,
      code,
      user.id,
      data.accessToken,
    );
    const env = await getServerEnvResolved();
    const hasAdmin = Boolean(getSupabaseAdmin());
    const siteUrl = (env.SITE_URL ?? process.env.VITE_SITE_URL ?? "https://belkou.online").replace(
      /\/$/,
      "",
    );

    const statsWarning = !tablesReady
      ? ("tables_unavailable" as const)
      : stats.referrals === 0 && !hasAdmin
        ? ("server_config" as const)
        : undefined;

    return {
      affiliate: {
        code,
        link: `${siteUrl}/signup?ref=${code}`,
        registerLink: `${siteUrl}/checkout?course=apps-ia-cursor-claude&ref=${code}`,
        commissionUsd: AFFILIATE_COMMISSION_USD,
        signupCommissionUsd: AFFILIATE_SIGNUP_COMMISSION_USD,
        minWithdrawalUsd: AFFILIATE_MIN_WITHDRAWAL_USD,
        stats,
        statsWarning,
        referralClaimed: claimResult.ok === true,
      },
    };
  });

export const claimSignupReferral = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        accessToken: z.string().min(1),
        /** Ignored for attribution — kept optional for backward-compatible clients. */
        referralCode: z.string().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const user = await getUserFromAccessToken(data.accessToken);
    if (!user?.email || !user.id) {
      return { ok: false as const, reason: "not_authenticated" };
    }

    // Client-supplied referralCode is intentionally ignored (anti late-attribution).
    const result = await claimSignupReferralFromTrustedSources({
      userId: user.id,
      email: normalizeRegistrationEmail(user.email),
      createdAt: user.created_at,
    });

    return result.ok ? { ok: true as const } : { ok: false as const, reason: result.reason };
  });

export const requestAffiliateWithdrawalFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        accessToken: z.string().min(1),
        paymentMethod: z.string().min(1).default("moncash"),
        paymentDetails: z.string().min(1),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const user = await getUserFromAccessToken(data.accessToken);
    if (!user?.email || !user.id) {
      return { ok: false as const, reason: "not_authenticated" };
    }

    const affiliateRecord = await getOrCreateAffiliate({
      userId: user.id,
      email: normalizeRegistrationEmail(user.email),
      fullName:
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined) ??
        user.email.split("@")[0],
    }).catch(() => null);

    const code = affiliateRecord?.code ?? affiliateCodeForUser(user);
    const stats = await getAffiliateStats(affiliateRecord?.id ?? user.id, code, user.id);

    const result = await requestAffiliateWithdrawal({
      userId: user.id,
      email: normalizeRegistrationEmail(user.email),
      code,
      availableBalanceUsd: stats.balanceUsd,
      paymentMethod: data.paymentMethod,
      paymentDetails: data.paymentDetails,
    });

    if (!result.ok) return result;

    const refreshed = await getAffiliateStats(affiliateRecord?.id ?? user.id, code, user.id);
    return { ok: true as const, amount: result.amount, stats: refreshed };
  });

export const validateReferralCode = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ code: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => {
    const affiliate = await getAffiliateByCode(data.code);
    if (!affiliate) return { valid: false as const };
    return { valid: true as const, name: affiliate.full_name.split(" ")[0] };
  });
