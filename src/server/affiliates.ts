import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { affiliateCodeForUser } from "@/lib/affiliate-code";
import { AFFILIATE_COMMISSION_USD } from "@/lib/affiliate-config";
import { normalizeRegistrationEmail } from "@/lib/schemas/registration";
import { getSupabaseAdmin } from "@/server/supabase-registrations";

export type AffiliateRecord = {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  code: string;
  created_at: string;
};

export type AffiliateReferralRecord = {
  id: string;
  affiliate_id: string;
  registration_id: string;
  referred_email: string;
  referral_code: string;
  amount_usd: number;
  status: "pending" | "earned" | "paid_out";
  created_at: string;
  earned_at: string | null;
};

let affiliateTablesAvailable: boolean | null = null;

function normalizeCode(code: string): string {
  return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function generateAffiliateCode(email: string): string {
  const base =
    email
      .split("@")[0]
      .replace(/[^a-z0-9]/gi, "")
      .slice(0, 4)
      .toUpperCase() || "BK";
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${base}${suffix}`;
}

function rowToAffiliate(row: Record<string, unknown>): AffiliateRecord {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    email: String(row.email),
    full_name: String(row.full_name),
    code: String(row.code),
    created_at: String(row.created_at),
  };
}

function rowToReferral(row: Record<string, unknown>): AffiliateReferralRecord {
  return {
    id: String(row.id),
    affiliate_id: String(row.affiliate_id),
    registration_id: String(row.registration_id),
    referred_email: String(row.referred_email),
    referral_code: String(row.referral_code),
    amount_usd: Number(row.amount_usd),
    status: row.status as AffiliateReferralRecord["status"],
    created_at: String(row.created_at),
    earned_at: row.earned_at ? String(row.earned_at) : null,
  };
}

function metadataToAffiliate(user: User, code: string): AffiliateRecord {
  const email = normalizeRegistrationEmail(user.email ?? "");
  const fullName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    email.split("@")[0];

  return {
    id: user.id,
    user_id: user.id,
    email,
    full_name: fullName,
    code: normalizeCode(code),
    created_at: user.created_at,
  };
}

function isMissingTableError(message: string): boolean {
  return (
    message.includes("does not exist") ||
    message.includes("Could not find the table") ||
    message.includes("schema cache")
  );
}

async function checkAffiliateTables(sb: SupabaseClient): Promise<boolean> {
  if (affiliateTablesAvailable !== null) return affiliateTablesAvailable;

  const { error } = await sb.from("affiliates").select("id").limit(1);
  affiliateTablesAvailable = !error || !isMissingTableError(error.message);
  return affiliateTablesAvailable;
}

async function getAffiliateCodeFromMetadata(sb: SupabaseClient, userId: string): Promise<string | null> {
  const { data, error } = await sb.auth.admin.getUserById(userId);
  if (error || !data.user) return null;

  const code = data.user.user_metadata?.affiliate_code;
  return typeof code === "string" && code ? normalizeCode(code) : null;
}

async function saveAffiliateCodeToMetadata(sb: SupabaseClient, userId: string, code: string): Promise<boolean> {
  const { data, error: getError } = await sb.auth.admin.getUserById(userId);
  if (getError || !data.user) return false;

  const { error } = await sb.auth.admin.updateUserById(userId, {
    user_metadata: {
      ...data.user.user_metadata,
      affiliate_code: normalizeCode(code),
    },
  });

  return !error;
}

async function findAffiliateInUserList(sb: SupabaseClient, code: string): Promise<AffiliateRecord | null> {
  const normalized = normalizeCode(code);
  if (!normalized) return null;

  let page = 1;
  const perPage = 200;

  while (page <= 10) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage });
    if (error || !data.users.length) break;

    for (const user of data.users) {
      if (!user.email) continue;
      const userCode = affiliateCodeForUser(user);
      if (userCode === normalized) {
        return metadataToAffiliate(user, userCode);
      }
    }

    if (data.users.length < perPage) break;
    page++;
  }

  return null;
}

async function getOrCreateAffiliateFromMetadata(params: {
  userId: string;
  email: string;
  fullName: string;
}): Promise<AffiliateRecord | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;

  const { data, error } = await sb.auth.admin.getUserById(params.userId);
  if (error || !data.user) return null;

  const existingCode = data.user.user_metadata?.affiliate_code;
  if (typeof existingCode === "string" && existingCode) {
    return metadataToAffiliate(data.user, existingCode);
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateAffiliateCode(params.email);
    const saved = await saveAffiliateCodeToMetadata(sb, params.userId, code);
    if (!saved) continue;

    const duplicate = await findAffiliateInUserList(sb, code);
    if (duplicate && duplicate.user_id !== params.userId) continue;

    return metadataToAffiliate(data.user, code);
  }

  return null;
}

export async function getAffiliateByCode(code: string): Promise<AffiliateRecord | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;

  const normalized = normalizeCode(code);
  if (!normalized) return null;

  if (await checkAffiliateTables(sb)) {
    const { data, error } = await sb.from("affiliates").select("*").eq("code", normalized).maybeSingle();
    if (!error && data) return rowToAffiliate(data);
  }

  return findAffiliateInUserList(sb, normalized);
}

export async function persistAffiliate(params: {
  userId: string;
  email: string;
  fullName: string;
  code: string;
}): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return;

  const email = normalizeRegistrationEmail(params.email);
  const code = normalizeCode(params.code);

  await saveAffiliateCodeToMetadata(sb, params.userId, code);

  if (!(await checkAffiliateTables(sb))) return;

  const existing = await getAffiliateByUserId(params.userId);
  if (existing) return;

  await sb.from("affiliates").insert({
    user_id: params.userId,
    email,
    full_name: params.fullName.trim(),
    code,
  });
}

export async function getAffiliateByUserId(userId: string): Promise<AffiliateRecord | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;

  if (await checkAffiliateTables(sb)) {
    const { data, error } = await sb.from("affiliates").select("*").eq("user_id", userId).maybeSingle();
    if (!error && data) return rowToAffiliate(data);
  }

  const code = await getAffiliateCodeFromMetadata(sb, userId);
  if (!code) return null;

  const { data, error } = await sb.auth.admin.getUserById(userId);
  if (error || !data.user) return null;
  return metadataToAffiliate(data.user, code);
}

export async function getOrCreateAffiliate(params: {
  userId: string;
  email: string;
  fullName: string;
}): Promise<AffiliateRecord | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;

  const email = normalizeRegistrationEmail(params.email);
  const existing = await getAffiliateByUserId(params.userId);
  if (existing) return existing;

  if (await checkAffiliateTables(sb)) {
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateAffiliateCode(email);
      const { data, error } = await sb
        .from("affiliates")
        .insert({
          user_id: params.userId,
          email,
          full_name: params.fullName.trim(),
          code,
        })
        .select()
        .single();

      if (!error && data) {
        await saveAffiliateCodeToMetadata(sb, params.userId, code);
        return rowToAffiliate(data);
      }

      if (error && isMissingTableError(error.message)) {
        affiliateTablesAvailable = false;
        break;
      }

      if (!error?.message.includes("duplicate") && !error?.message.includes("unique")) {
        console.error("[BelKou] create affiliate:", error?.message);
        break;
      }
    }
  }

  return getOrCreateAffiliateFromMetadata({
    userId: params.userId,
    email,
    fullName: params.fullName,
  });
}

export async function setRegistrationReferralCode(
  registrationId: string,
  referralCode: string,
): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return;

  const code = normalizeCode(referralCode);
  if (!code) return;

  const { error } = await sb
    .from("registrations")
    .update({ referral_code: code, updated_at: new Date().toISOString() })
    .eq("id", registrationId);

  if (error && !error.message.includes("referral_code")) {
    console.error("[BelKou] set referral_code:", error.message);
  }
}

export async function attributeReferral(params: {
  registrationId: string;
  referredEmail: string;
  referralCode: string;
}): Promise<{ ok: boolean; reason?: string }> {
  const sb = getSupabaseAdmin();
  if (!sb) return { ok: false, reason: "db_unavailable" };

  const code = normalizeCode(params.referralCode);
  if (!code) return { ok: false, reason: "invalid_code" };

  const affiliate = await getAffiliateByCode(code);
  if (!affiliate) return { ok: false, reason: "code_not_found" };

  const referredEmail = normalizeRegistrationEmail(params.referredEmail);
  if (affiliate.email === referredEmail) {
    return { ok: false, reason: "self_referral" };
  }

  await setRegistrationReferralCode(params.registrationId, code);

  if (!(await checkAffiliateTables(sb))) {
    return { ok: true };
  }

  const { data: existing } = await sb
    .from("affiliate_referrals")
    .select("id")
    .eq("registration_id", params.registrationId)
    .maybeSingle();

  if (existing) return { ok: true };

  const { error } = await sb.from("affiliate_referrals").insert({
    affiliate_id: affiliate.id,
    registration_id: params.registrationId,
    referred_email: referredEmail,
    referral_code: code,
    amount_usd: AFFILIATE_COMMISSION_USD,
    status: "pending",
  });

  if (error && !isMissingTableError(error.message)) {
    console.error("[BelKou] attribute referral:", error.message);
    return { ok: false, reason: "insert_failed" };
  }

  return { ok: true };
}

async function getStatsFromRegistrations(sb: SupabaseClient, code: string) {
  const { data, error } = await sb
    .from("registrations")
    .select("id, email, payment_status, created_at, referral_code")
    .eq("referral_code", code)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return { referrals: 0, pending: 0, earned: 0, paidOut: 0, balanceUsd: 0, referralsList: [] as AffiliateReferralRecord[] };
  }

  const referralsList: AffiliateReferralRecord[] = data.map((row) => {
    const paid = row.payment_status === "paid";
    return {
      id: String(row.id),
      affiliate_id: code,
      registration_id: String(row.id),
      referred_email: String(row.email),
      referral_code: code,
      amount_usd: AFFILIATE_COMMISSION_USD,
      status: paid ? "earned" : "pending",
      created_at: String(row.created_at),
      earned_at: paid ? String(row.created_at) : null,
    };
  });

  const pending = referralsList.filter((r) => r.status === "pending").length;
  const earned = referralsList.filter((r) => r.status === "earned").length;

  return {
    referrals: referralsList.length,
    pending,
    earned,
    paidOut: 0,
    balanceUsd: earned * AFFILIATE_COMMISSION_USD,
    referralsList: referralsList.slice(0, 10),
  };
}

export async function earnAffiliateCommission(registrationId: string): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return;

  const { data: registration, error: regError } = await sb
    .from("registrations")
    .select("id, email, referral_code, payment_status")
    .eq("id", registrationId)
    .maybeSingle();

  if (regError || !registration || registration.payment_status !== "paid") return;

  const referralCode = registration.referral_code ? String(registration.referral_code) : "";
  if (!referralCode) return;

  if (!(await checkAffiliateTables(sb))) return;

  const { data: existing } = await sb
    .from("affiliate_referrals")
    .select("*")
    .eq("registration_id", registrationId)
    .maybeSingle();

  if (existing?.status === "earned" || existing?.status === "paid_out") return;

  if (existing) {
    await sb
      .from("affiliate_referrals")
      .update({ status: "earned", earned_at: new Date().toISOString() })
      .eq("id", existing.id);
    return;
  }

  const affiliate = await getAffiliateByCode(referralCode);
  if (!affiliate) return;

  const referredEmail = normalizeRegistrationEmail(String(registration.email));
  if (affiliate.email === referredEmail) return;

  await sb.from("affiliate_referrals").insert({
    affiliate_id: affiliate.id,
    registration_id: registrationId,
    referred_email: referredEmail,
    referral_code: normalizeCode(referralCode),
    amount_usd: AFFILIATE_COMMISSION_USD,
    status: "earned",
    earned_at: new Date().toISOString(),
  });
}

export async function getAffiliateStats(affiliateId: string, affiliateCode?: string) {
  const sb = getSupabaseAdmin();
  if (!sb) {
    return { referrals: 0, pending: 0, earned: 0, paidOut: 0, balanceUsd: 0, referralsList: [] as AffiliateReferralRecord[] };
  }

  if (await checkAffiliateTables(sb)) {
    const { data, error } = await sb
      .from("affiliate_referrals")
      .select("*")
      .eq("affiliate_id", affiliateId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      const referralsList = data.map((row) => rowToReferral(row as Record<string, unknown>));
      const pending = referralsList.filter((r) => r.status === "pending").length;
      const earned = referralsList.filter((r) => r.status === "earned").length;
      const paidOut = referralsList.filter((r) => r.status === "paid_out").length;
      const balanceUsd = referralsList
        .filter((r) => r.status === "earned")
        .reduce((sum, r) => sum + r.amount_usd, 0);

      return {
        referrals: referralsList.length,
        pending,
        earned,
        paidOut,
        balanceUsd,
        referralsList: referralsList.slice(0, 10),
      };
    }
  }

  if (affiliateCode) {
    return getStatsFromRegistrations(sb, normalizeCode(affiliateCode));
  }

  return { referrals: 0, pending: 0, earned: 0, paidOut: 0, balanceUsd: 0, referralsList: [] as AffiliateReferralRecord[] };
}
