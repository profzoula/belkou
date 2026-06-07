import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { AFFILIATE_COMMISSION_USD } from "@/lib/affiliate-config";
import { affiliateCodeForUser } from "@/lib/affiliate-code";
import { normalizeRegistrationEmail } from "@/lib/schemas/registration";
import { getUserFromAccessToken } from "@/server/supabase-auth";
import {
  getAffiliateByCode,
  getAffiliateStats,
  persistAffiliate,
} from "@/server/affiliates";
import { getServerEnvResolved } from "@/server/env";

export const getAffiliateDashboard = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ accessToken: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => {
    const user = await getUserFromAccessToken(data.accessToken);
    if (!user?.email || !user.id) {
      return { affiliate: null as const, error: "not_authenticated" as const };
    }

    const code = affiliateCodeForUser(user);
    const fullName =
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      user.email.split("@")[0];

    void persistAffiliate({
      userId: user.id,
      email: normalizeRegistrationEmail(user.email),
      fullName,
      code,
    }).catch((err) => console.warn("[BelKou] persist affiliate:", err));

    const stats = await getAffiliateStats(user.id, code);
    const env = await getServerEnvResolved();
    const siteUrl = (env.SITE_URL ?? process.env.VITE_SITE_URL ?? "https://belkou.online").replace(
      /\/$/,
      "",
    );

    return {
      affiliate: {
        code,
        link: `${siteUrl}/register?ref=${code}`,
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
