import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { AFFILIATE_COMMISSION_USD } from "@/lib/affiliate-config";
import { getUserFromAccessToken } from "@/server/supabase-auth";
import {
  getAffiliateByCode,
  getAffiliateStats,
  getOrCreateAffiliate,
} from "@/server/affiliates";
import { getServerEnvResolved } from "@/server/env";

export const getAffiliateDashboard = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ accessToken: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => {
    const user = await getUserFromAccessToken(data.accessToken);
    if (!user?.email || !user.id) {
      return { affiliate: null as const, error: "not_authenticated" as const };
    }

    const fullName =
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      user.email.split("@")[0];

    const affiliate = await getOrCreateAffiliate({
      userId: user.id,
      email: user.email,
      fullName,
    });

    if (!affiliate) {
      return { affiliate: null as const, error: "create_failed" as const };
    }

    const stats = await getAffiliateStats(affiliate.id, affiliate.code);
    const env = await getServerEnvResolved();
    const siteUrl = env.SITE_URL.replace(/\/$/, "");

    return {
      affiliate: {
        code: affiliate.code,
        link: `${siteUrl}/register?ref=${affiliate.code}`,
        commissionUsd: AFFILIATE_COMMISSION_USD,
        stats,
      },
    };
  });

export const validateReferralCode = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ code: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => {
    const affiliate = await getAffiliateByCode(data.code);
    if (!affiliate) return { valid: false as const };
    return { valid: true as const, name: affiliate.full_name.split(" ")[0] };
  });
