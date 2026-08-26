import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  affiliateCodeForUser,
  deriveAffiliateCode,
  normalizeAffiliateCode,
} from "@/lib/affiliate-code";
import {
  AFFILIATE_COMMISSION_USD,
  AFFILIATE_OAUTH_BIND_MAX_AGE_MS,
  AFFILIATE_SIGNUP_CLAIM_MAX_AGE_MS,
  AFFILIATE_SIGNUP_COMMISSION_USD,
  AFFILIATE_SIGNUP_REFERRAL_PREFIX,
} from "@/lib/affiliate-config";
import { normalizeRegistrationEmail } from "@/lib/schemas/registration";
import {
  computeAvailableBalance,
  getWithdrawalTotals,
  listAllWithdrawals,
  type WithdrawalRecord,
} from "@/server/affiliate-withdrawals";
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
  referral_type: "signup" | "enrollment";
  status: "pending" | "earned" | "paid_out";
  created_at: string;
  earned_at: string | null;
};

let affiliateTablesAvailable: boolean | null = null;

function normalizeCode(code: string): string {
  return normalizeAffiliateCode(code);
}

function isWithinMs(isoDate: string | undefined, maxAgeMs: number): boolean {
  if (!isoDate) return false;
  const created = Date.parse(isoDate);
  if (Number.isNaN(created)) return false;
  return Date.now() - created <= maxAgeMs;
}

/** Signup commissions only for accounts still inside the claim window. */
export function isSignupReferralClaimEligible(createdAt: string | undefined): boolean {
  return isWithinMs(createdAt, AFFILIATE_SIGNUP_CLAIM_MAX_AGE_MS);
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
    referral_type: (row.referral_type as AffiliateReferralRecord["referral_type"]) ?? "enrollment",
    status: row.status as AffiliateReferralRecord["status"],
    created_at: String(row.created_at),
    earned_at: row.earned_at ? String(row.earned_at) : null,
  };
}

function signupReferralId(userId: string): string {
  return `${AFFILIATE_SIGNUP_REFERRAL_PREFIX}${userId}`;
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
  if (affiliateTablesAvailable === true) return true;

  const { error } = await sb.from("affiliates").select("id").limit(1);
  if (!error) {
    affiliateTablesAvailable = true;
    return true;
  }
  if (isMissingTableError(error.message)) {
    affiliateTablesAvailable = false;
    return false;
  }
  console.warn("[BelKou] affiliate table check:", error.message);
  return false;
}

/** Public probe for ops / dashboard — true when affiliates + referrals tables are readable. */
export async function areAffiliateTablesReady(): Promise<boolean> {
  const sb = getSupabaseAdmin();
  if (!sb) return false;
  return checkAffiliateTables(sb);
}

async function getAffiliateCodeFromMetadata(
  sb: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data, error } = await sb.auth.admin.getUserById(userId);
  if (error || !data.user) return null;

  const code = data.user.user_metadata?.affiliate_code;
  return typeof code === "string" && code ? normalizeCode(code) : null;
}

async function saveAffiliateCodeToMetadata(
  sb: SupabaseClient,
  userId: string,
  code: string,
): Promise<boolean> {
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

async function findAffiliateInUserList(
  sb: SupabaseClient,
  code: string,
): Promise<AffiliateRecord | null> {
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

  const code = deriveAffiliateCode(params.userId, params.email);
  const saved = await saveAffiliateCodeToMetadata(sb, params.userId, code);
  if (!saved) return metadataToAffiliate(data.user, code);

  return metadataToAffiliate(data.user, code);
}

/** Ensures a row exists in `affiliates` and returns the DB record (uuid id for FK inserts). */
export async function ensureAffiliateDbRecord(
  affiliate: AffiliateRecord,
): Promise<AffiliateRecord | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;
  if (!(await checkAffiliateTables(sb))) return affiliate;

  const { data: byUser, error: userError } = await sb
    .from("affiliates")
    .select("*")
    .eq("user_id", affiliate.user_id)
    .maybeSingle();

  if (!userError && byUser) return rowToAffiliate(byUser);

  const { data: inserted, error: insertError } = await sb
    .from("affiliates")
    .insert({
      user_id: affiliate.user_id,
      email: affiliate.email,
      full_name: affiliate.full_name,
      code: affiliate.code,
    })
    .select()
    .single();

  if (!insertError && inserted) return rowToAffiliate(inserted);

  if (insertError?.message.includes("duplicate") || insertError?.message.includes("unique")) {
    const { data: retry } = await sb
      .from("affiliates")
      .select("*")
      .eq("user_id", affiliate.user_id)
      .maybeSingle();
    if (retry) return rowToAffiliate(retry);
  }

  if (insertError) {
    console.error("[BelKou] ensure affiliate record:", insertError.message);
  }

  return null;
}

async function insertAffiliateReferral(
  sb: SupabaseClient,
  row: Record<string, unknown>,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await sb.from("affiliate_referrals").insert(row);

  if (!error) return { ok: true };

  if (error.message.includes("referral_type")) {
    const { referral_type: _type, ...withoutType } = row;
    const { error: retryError } = await sb.from("affiliate_referrals").insert(withoutType);
    if (!retryError) return { ok: true };
    return { ok: false, error: retryError.message };
  }

  if (isMissingTableError(error.message)) {
    affiliateTablesAvailable = false;
    return { ok: false, error: "affiliate_tables_missing" };
  }
  return { ok: false, error: error.message };
}

export async function getAffiliateByCode(code: string): Promise<AffiliateRecord | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;

  const normalized = normalizeCode(code);
  if (!normalized) return null;

  if (await checkAffiliateTables(sb)) {
    const { data, error } = await sb
      .from("affiliates")
      .select("*")
      .eq("code", normalized)
      .maybeSingle();
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

  const { data: existing } = await sb
    .from("affiliates")
    .select("id, code")
    .eq("user_id", params.userId)
    .maybeSingle();

  if (existing) {
    if (normalizeCode(String(existing.code)) !== code) {
      const { error: updateError } = await sb
        .from("affiliates")
        .update({ code, email, full_name: params.fullName.trim() })
        .eq("user_id", params.userId);
      if (updateError && !updateError.message.includes("unique")) {
        console.error("[BelKou] sync affiliate code:", updateError.message);
      }
    }
    return;
  }

  const { error } = await sb.from("affiliates").insert({
    user_id: params.userId,
    email,
    full_name: params.fullName.trim(),
    code,
  });

  if (error && !error.message.includes("duplicate") && !error.message.includes("unique")) {
    console.error("[BelKou] persist affiliate:", error.message);
  }
}

export async function getAffiliateByUserId(userId: string): Promise<AffiliateRecord | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;

  if (await checkAffiliateTables(sb)) {
    const { data, error } = await sb
      .from("affiliates")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (!error && data) return rowToAffiliate(data);
  }

  const code = await getAffiliateCodeFromMetadata(sb, userId);
  if (!code) return null;

  const { data, error } = await sb.auth.admin.getUserById(userId);
  if (error || !data.user) return null;

  const metaAffiliate = metadataToAffiliate(data.user, code);
  if (await checkAffiliateTables(sb)) {
    return (await ensureAffiliateDbRecord(metaAffiliate)) ?? metaAffiliate;
  }
  return metaAffiliate;
}

/** Load referrals for an affiliate user — matches by DB id and all known codes. */
async function listReferralsForAffiliateUser(
  sb: SupabaseClient,
  userId: string,
  affiliateCode?: string,
  options?: { useAdminMetadata?: boolean },
): Promise<AffiliateReferralRecord[]> {
  const codes = new Set<string>();
  if (affiliateCode) codes.add(normalizeCode(affiliateCode));

  if (options?.useAdminMetadata !== false) {
    const metaCode = await getAffiliateCodeFromMetadata(sb, userId);
    if (metaCode) codes.add(metaCode);
  }

  const { data: affiliateRows } = await sb
    .from("affiliates")
    .select("id, code")
    .eq("user_id", userId);

  const affiliateIds: string[] = [];
  for (const row of affiliateRows ?? []) {
    affiliateIds.push(String(row.id));
    codes.add(normalizeCode(String(row.code)));
  }

  const seen = new Set<string>();
  const results: AffiliateReferralRecord[] = [];

  const appendRows = (rows: Record<string, unknown>[] | null) => {
    for (const row of rows ?? []) {
      const ref = rowToReferral(row);
      if (seen.has(ref.id)) continue;
      seen.add(ref.id);
      results.push(ref);
    }
  };

  if (affiliateIds.length > 0) {
    const { data, error } = await sb
      .from("affiliate_referrals")
      .select("*")
      .in("affiliate_id", affiliateIds)
      .order("created_at", { ascending: false });
    if (error) console.warn("[BelKou] referrals by affiliate_id:", error.message);
    else appendRows(data);
  }

  for (const code of codes) {
    if (!code) continue;
    const { data, error } = await sb
      .from("affiliate_referrals")
      .select("*")
      .eq("referral_code", code)
      .order("created_at", { ascending: false });
    if (error) console.warn("[BelKou] referrals by referral_code:", error.message);
    else appendRows(data);
  }

  return results.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

function buildStatsFromReferrals(
  referralsList: AffiliateReferralRecord[],
  userId: string | undefined,
  affiliateCode: string | undefined,
): Promise<AffiliateStats> {
  const pending = referralsList.filter((r) => r.status === "pending").length;
  const earned = referralsList.filter((r) => r.status === "earned").length;
  const paidOut = referralsList.filter((r) => r.status === "paid_out").length;
  const grossBalance = referralsList
    .filter((r) => r.status === "earned")
    .reduce((sum, r) => sum + Number(r.amount_usd), 0);

  return applyWithdrawalBalance(
    {
      referrals: referralsList.length,
      pending,
      earned,
      earnedUsd: grossBalance,
      paidOut,
      balanceUsd: grossBalance,
      referralsList: referralsList.slice(0, 10),
    },
    userId,
    affiliateCode,
  );
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
  if (existing) {
    const ensured = await ensureAffiliateDbRecord(existing);
    return ensured ?? existing;
  }

  const code = deriveAffiliateCode(params.userId, email);

  if (await checkAffiliateTables(sb)) {
    const { data: byCode } = await sb.from("affiliates").select("*").eq("code", code).maybeSingle();
    if (byCode) {
      const existingByCode = rowToAffiliate(byCode);
      if (existingByCode.user_id === params.userId) {
        await saveAffiliateCodeToMetadata(sb, params.userId, code);
        return existingByCode;
      }
      // Extremely rare collision: extend with more of the user id.
      const fallbackCode = normalizeCode(
        `${code}${params.userId.replace(/-/g, "").toUpperCase().slice(4, 8)}`,
      );
      const { data, error } = await sb
        .from("affiliates")
        .insert({
          user_id: params.userId,
          email,
          full_name: params.fullName.trim(),
          code: fallbackCode,
        })
        .select()
        .single();

      if (!error && data) {
        await saveAffiliateCodeToMetadata(sb, params.userId, fallbackCode);
        return rowToAffiliate(data);
      }
    } else {
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
      } else if (error) {
        console.error("[BelKou] create affiliate:", error.message);
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
    console.error(
      "[BelKou] Affiliate tables missing — enrollment referral_code saved but commission row not created. Run migrations/supabase_affiliates.sql",
    );
    return { ok: false, reason: "tables_unavailable" };
  }

  const { data: existing } = await sb
    .from("affiliate_referrals")
    .select("id")
    .eq("registration_id", params.registrationId)
    .maybeSingle();

  if (existing) return { ok: true };

  const dbAffiliate = await ensureAffiliateDbRecord(affiliate);
  if (!dbAffiliate) return { ok: false, reason: "affiliate_not_persisted" };

  const insertResult = await insertAffiliateReferral(sb, {
    affiliate_id: dbAffiliate.id,
    registration_id: params.registrationId,
    referred_email: referredEmail,
    referral_code: code,
    amount_usd: AFFILIATE_COMMISSION_USD,
    referral_type: "enrollment",
    status: "pending",
  });

  if (!insertResult.ok) {
    console.error("[BelKou] attribute referral:", insertResult.error);
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
    return {
      referrals: 0,
      pending: 0,
      earned: 0,
      paidOut: 0,
      balanceUsd: 0,
      earnedUsd: 0,
      referralsList: [] as AffiliateReferralRecord[],
    };
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
      referral_type: "enrollment",
      status: paid ? "earned" : "pending",
      created_at: String(row.created_at),
      earned_at: paid ? String(row.created_at) : null,
    };
  });

  const pending = referralsList.filter((r) => r.status === "pending").length;
  const earned = referralsList.filter((r) => r.status === "earned").length;
  const balanceUsd = referralsList
    .filter((r) => r.status === "earned")
    .reduce((sum, r) => sum + r.amount_usd, 0);

  return {
    referrals: referralsList.length,
    pending,
    earned,
    paidOut: 0,
    balanceUsd,
    earnedUsd: balanceUsd,
    referralsList: referralsList.slice(0, 10),
  };
}

/**
 * Awards signup commission only when:
 * - referralCode comes from trusted signup metadata (caller responsibility), and
 * - the referred account is still inside the claim window (anti late-attribution).
 */
export async function earnSignupAffiliateCommission(params: {
  userId: string;
  email: string;
  referralCode: string;
  createdAt?: string;
}): Promise<{ ok: boolean; reason?: string }> {
  const sb = getSupabaseAdmin();
  if (!sb) return { ok: false, reason: "db_unavailable" };

  let createdAt = params.createdAt;
  if (!createdAt) {
    const { data } = await sb.auth.admin.getUserById(params.userId);
    createdAt = data.user?.created_at;
  }

  if (!isSignupReferralClaimEligible(createdAt)) {
    return { ok: false, reason: "claim_window_expired" };
  }

  const code = normalizeCode(params.referralCode);
  if (!code) return { ok: false, reason: "invalid_code" };

  const affiliate = await getAffiliateByCode(code);
  if (!affiliate) return { ok: false, reason: "code_not_found" };

  const referredEmail = normalizeRegistrationEmail(params.email);
  if (affiliate.email === referredEmail || affiliate.user_id === params.userId) {
    return { ok: false, reason: "self_referral" };
  }

  if (!(await checkAffiliateTables(sb))) {
    console.warn("[BelKou] earn signup commission: affiliate tables unavailable");
    return { ok: false, reason: "tables_unavailable" };
  }

  const dbAffiliate = await ensureAffiliateDbRecord(affiliate);
  if (!dbAffiliate) {
    console.error("[BelKou] earn signup commission: could not persist affiliate", code);
    return { ok: false, reason: "affiliate_not_persisted" };
  }

  const registrationId = signupReferralId(params.userId);

  const { data: existing } = await sb
    .from("affiliate_referrals")
    .select("id")
    .eq("registration_id", registrationId)
    .maybeSingle();

  if (existing) return { ok: true };

  const insertResult = await insertAffiliateReferral(sb, {
    affiliate_id: dbAffiliate.id,
    registration_id: registrationId,
    referred_email: referredEmail,
    referral_code: code,
    amount_usd: AFFILIATE_SIGNUP_COMMISSION_USD,
    referral_type: "signup",
    status: "earned",
    earned_at: new Date().toISOString(),
  });

  if (!insertResult.ok) {
    console.error("[BelKou] earn signup commission:", insertResult.error);
    return { ok: false, reason: "insert_failed" };
  }

  return { ok: true };
}

/**
 * Claims signup commission using only user_metadata.referred_by (never client localStorage).
 * Optionally binds a cookie code for brand-new OAuth accounts.
 */
export async function claimSignupReferralFromTrustedSources(params: {
  userId: string;
  email: string;
  createdAt?: string;
  /** Cookie/local ref — only used to bind referred_by for brand-new OAuth accounts. */
  ephemeralReferralCode?: string | null;
}): Promise<{ ok: boolean; reason?: string; claimedCode?: string }> {
  const sb = getSupabaseAdmin();
  if (!sb) return { ok: false, reason: "db_unavailable" };

  const { data, error } = await sb.auth.admin.getUserById(params.userId);
  if (error || !data.user) return { ok: false, reason: "user_not_found" };

  const user = data.user;
  const createdAt = params.createdAt ?? user.created_at;
  const metaCode =
    typeof user.user_metadata?.referred_by === "string"
      ? normalizeCode(user.user_metadata.referred_by)
      : "";

  let referralCode = metaCode;

  if (!referralCode) {
    const ephemeral = params.ephemeralReferralCode
      ? normalizeCode(params.ephemeralReferralCode)
      : "";
    if (ephemeral && isWithinMs(createdAt, AFFILIATE_OAUTH_BIND_MAX_AGE_MS)) {
      const { error: updateError } = await sb.auth.admin.updateUserById(params.userId, {
        user_metadata: {
          ...user.user_metadata,
          referred_by: ephemeral,
        },
      });
      if (!updateError) {
        referralCode = ephemeral;
      }
    }
  }

  if (!referralCode) {
    return { ok: false, reason: "no_code" };
  }

  const result = await earnSignupAffiliateCommission({
    userId: params.userId,
    email: params.email,
    referralCode,
    createdAt,
  });

  return result.ok ? { ok: true, claimedCode: referralCode } : { ok: false, reason: result.reason };
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

  const dbAffiliate = await ensureAffiliateDbRecord(affiliate);
  if (!dbAffiliate) return;

  await insertAffiliateReferral(sb, {
    affiliate_id: dbAffiliate.id,
    registration_id: registrationId,
    referred_email: referredEmail,
    referral_code: normalizeCode(referralCode),
    amount_usd: AFFILIATE_COMMISSION_USD,
    referral_type: "enrollment",
    status: "earned",
    earned_at: new Date().toISOString(),
  });
}

export type AffiliateStats = {
  referrals: number;
  pending: number;
  earned: number;
  earnedUsd: number;
  paidOut: number;
  balanceUsd: number;
  withdrawalPaidUsd: number;
  withdrawalPendingUsd: number;
  hasPendingWithdrawal: boolean;
  referralsList: AffiliateReferralRecord[];
};

async function applyWithdrawalBalance(
  stats: Omit<
    AffiliateStats,
    "withdrawalPaidUsd" | "withdrawalPendingUsd" | "hasPendingWithdrawal"
  >,
  userId: string | undefined,
  affiliateCode: string | undefined,
): Promise<AffiliateStats> {
  if (!userId || !affiliateCode) {
    return {
      ...stats,
      earnedUsd: stats.earnedUsd ?? stats.balanceUsd,
      withdrawalPaidUsd: 0,
      withdrawalPendingUsd: 0,
      hasPendingWithdrawal: false,
    };
  }

  const totals = await getWithdrawalTotals(userId, normalizeCode(affiliateCode));
  return {
    ...stats,
    earnedUsd: stats.earnedUsd ?? stats.balanceUsd,
    balanceUsd: computeAvailableBalance(stats.balanceUsd, totals),
    withdrawalPaidUsd: totals.paid,
    withdrawalPendingUsd: totals.pending,
    hasPendingWithdrawal: totals.hasPending,
  };
}

export async function getAffiliateStats(
  affiliateId: string,
  affiliateCode?: string,
  userId?: string,
  accessToken?: string,
): Promise<AffiliateStats> {
  const empty: AffiliateStats = {
    referrals: 0,
    pending: 0,
    earned: 0,
    earnedUsd: 0,
    paidOut: 0,
    balanceUsd: 0,
    withdrawalPaidUsd: 0,
    withdrawalPendingUsd: 0,
    hasPendingWithdrawal: false,
    referralsList: [],
  };

  const adminSb = getSupabaseAdmin();
  const resolvedCode = affiliateCode ? normalizeCode(affiliateCode) : "";

  if (userId) {
    let referralsList: AffiliateReferralRecord[] = [];

    if (adminSb && (await checkAffiliateTables(adminSb))) {
      referralsList = await listReferralsForAffiliateUser(
        adminSb,
        userId,
        resolvedCode || affiliateCode,
      );
    }

    if (referralsList.length === 0 && accessToken) {
      const { getSupabaseAsUser } = await import("@/server/supabase-user-client");
      const userSb = getSupabaseAsUser(accessToken);
      if (userSb) {
        const viaUser = await listReferralsForAffiliateUser(
          userSb,
          userId,
          resolvedCode || affiliateCode,
          { useAdminMetadata: false },
        );
        if (viaUser.length > 0) referralsList = viaUser;
      }
    }

    if (referralsList.length > 0) {
      return buildStatsFromReferrals(referralsList, userId, resolvedCode || affiliateCode);
    }
  }

  if (adminSb && resolvedCode) {
    const regStats = await getStatsFromRegistrations(adminSb, resolvedCode);
    if (regStats.referrals > 0) {
      return applyWithdrawalBalance(regStats, userId, affiliateCode);
    }
  }

  if (!adminSb && !accessToken) {
    console.error("[BelKou] getAffiliateStats: no Supabase admin or user token");
  }

  return empty;
}

export type AffiliateAdminRow = {
  userId: string;
  email: string;
  fullName: string;
  code: string;
  referrals: number;
  pending: number;
  earned: number;
  balanceUsd: number;
  withdrawalPaidUsd: number;
  withdrawalPendingUsd: number;
};

/** Lightweight counts for the admin overview — avoids loading every affiliate's stats. */
export async function getAdminAffiliateSummary(): Promise<{
  affiliateCount: number;
  pendingWithdrawals: number;
}> {
  const sb = getSupabaseAdmin();
  if (!sb || !(await checkAffiliateTables(sb))) {
    return { affiliateCount: 0, pendingWithdrawals: 0 };
  }

  const [affiliatesRes, pendingRes] = await Promise.all([
    sb.from("affiliates").select("id", { count: "exact", head: true }),
    sb
      .from("affiliate_withdrawals")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  return {
    affiliateCount: affiliatesRes.count ?? 0,
    pendingWithdrawals: pendingRes.error ? 0 : (pendingRes.count ?? 0),
  };
}

export async function getAdminAffiliateOverview(): Promise<{
  affiliates: AffiliateAdminRow[];
  withdrawals: WithdrawalRecord[];
}> {
  const sb = getSupabaseAdmin();
  const byCode = new Map<string, AffiliateAdminRow>();

  if (sb && (await checkAffiliateTables(sb))) {
    const { data } = await sb.from("affiliates").select("*");
    for (const row of data ?? []) {
      const affiliate = rowToAffiliate(row as Record<string, unknown>);
      byCode.set(affiliate.code, {
        userId: affiliate.user_id,
        email: affiliate.email,
        fullName: affiliate.full_name,
        code: affiliate.code,
        referrals: 0,
        pending: 0,
        earned: 0,
        balanceUsd: 0,
        withdrawalPaidUsd: 0,
        withdrawalPendingUsd: 0,
      });
    }
  }

  // Stats + withdrawals in parallel (was a sequential N+1 per affiliate).
  const [affiliates, withdrawals] = await Promise.all([
    Promise.all(
      [...byCode.values()].map(async (row) => {
        const stats = await getAffiliateStats(row.userId || row.code, row.code, row.userId || undefined);
        return {
          ...row,
          referrals: stats.referrals,
          pending: stats.pending,
          earned: stats.earned,
          balanceUsd: stats.balanceUsd,
          withdrawalPaidUsd: stats.withdrawalPaidUsd,
          withdrawalPendingUsd: stats.withdrawalPendingUsd,
        } satisfies AffiliateAdminRow;
      }),
    ),
    listAllWithdrawals(),
  ]);

  affiliates.sort((a, b) => b.earned - a.earned || b.referrals - a.referrals);

  return { affiliates, withdrawals };
}
