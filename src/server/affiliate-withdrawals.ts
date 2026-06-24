import { AFFILIATE_MIN_WITHDRAWAL_USD } from "@/lib/affiliate-config";
import { normalizeRegistrationEmail } from "@/lib/schemas/registration";
import { getSupabaseAdmin } from "@/server/supabase-registrations";

export type WithdrawalRecord = {
  id: string;
  user_id: string;
  affiliate_email: string;
  affiliate_code: string;
  amount_usd: number;
  status: "pending" | "paid" | "rejected";
  payment_method: string;
  payment_details: string;
  admin_note: string | null;
  created_at: string;
  processed_at: string | null;
};

const devWithdrawals = new Map<string, WithdrawalRecord>();

function rowToWithdrawal(row: Record<string, unknown>): WithdrawalRecord {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    affiliate_email: String(row.affiliate_email),
    affiliate_code: String(row.affiliate_code),
    amount_usd: Number(row.amount_usd),
    status: row.status as WithdrawalRecord["status"],
    payment_method: String(row.payment_method),
    payment_details: String(row.payment_details),
    admin_note: row.admin_note ? String(row.admin_note) : null,
    created_at: String(row.created_at),
    processed_at: row.processed_at ? String(row.processed_at) : null,
  };
}

function isMissingTableError(message: string): boolean {
  return (
    message.includes("does not exist") ||
    message.includes("Could not find the table") ||
    message.includes("schema cache")
  );
}

export async function listWithdrawalsForUser(userId: string): Promise<WithdrawalRecord[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [...devWithdrawals.values()].filter((w) => w.user_id === userId);

  const { data, error } = await sb
    .from("affiliate_withdrawals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingTableError(error.message)) return [];
    console.error("[BelKou] list withdrawals:", error.message);
    return [];
  }

  return (data ?? []).map((row) => rowToWithdrawal(row as Record<string, unknown>));
}

export async function listAllWithdrawals(): Promise<WithdrawalRecord[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [...devWithdrawals.values()].sort((a, b) => b.created_at.localeCompare(a.created_at));

  const { data, error } = await sb
    .from("affiliate_withdrawals")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingTableError(error.message)) return [];
    console.error("[BelKou] list all withdrawals:", error.message);
    return [];
  }

  return (data ?? []).map((row) => rowToWithdrawal(row as Record<string, unknown>));
}

export async function getWithdrawalTotals(userId: string, code: string) {
  const withdrawals = (await listWithdrawalsForUser(userId)).filter(
    (w) => w.affiliate_code === code,
  );

  const pending = withdrawals
    .filter((w) => w.status === "pending")
    .reduce((sum, w) => sum + w.amount_usd, 0);
  const paid = withdrawals
    .filter((w) => w.status === "paid")
    .reduce((sum, w) => sum + w.amount_usd, 0);
  const hasPending = withdrawals.some((w) => w.status === "pending");

  return { pending, paid, hasPending, withdrawals };
}

export function computeAvailableBalance(
  grossUsd: number,
  withdrawalTotals: { pending: number; paid: number },
) {
  return Math.max(0, grossUsd - withdrawalTotals.paid - withdrawalTotals.pending);
}

export async function requestAffiliateWithdrawal(params: {
  userId: string;
  email: string;
  code: string;
  availableBalanceUsd: number;
  paymentMethod: string;
  paymentDetails: string;
}): Promise<{ ok: true; amount: number } | { ok: false; reason: string }> {
  const totals = await getWithdrawalTotals(params.userId, params.code);
  const available = params.availableBalanceUsd;

  if (available < AFFILIATE_MIN_WITHDRAWAL_USD) {
    return {
      ok: false,
      reason: `Minimum $${AFFILIATE_MIN_WITHDRAWAL_USD} requis (solde disponible: $${available.toFixed(0)})`,
    };
  }

  if (totals.hasPending) {
    return { ok: false, reason: "Vous avez déjà une demande de retrait en cours." };
  }

  if (!params.paymentDetails.trim()) {
    return { ok: false, reason: "Indiquez vos coordonnées de paiement (MonCash, Zelle, etc.)." };
  }

  const sb = getSupabaseAdmin();
  const record: WithdrawalRecord = {
    id: crypto.randomUUID(),
    user_id: params.userId,
    affiliate_email: normalizeRegistrationEmail(params.email),
    affiliate_code: params.code,
    amount_usd: available,
    status: "pending",
    payment_method: params.paymentMethod,
    payment_details: params.paymentDetails.trim(),
    admin_note: null,
    created_at: new Date().toISOString(),
    processed_at: null,
  };

  if (!sb) {
    devWithdrawals.set(record.id, record);
    return { ok: true, amount: available };
  }

  const { error } = await sb.from("affiliate_withdrawals").insert({
    user_id: record.user_id,
    affiliate_email: record.affiliate_email,
    affiliate_code: record.affiliate_code,
    amount_usd: record.amount_usd,
    status: record.status,
    payment_method: record.payment_method,
    payment_details: record.payment_details,
  });

  if (error) {
    if (isMissingTableError(error.message)) {
      devWithdrawals.set(record.id, record);
      return { ok: true, amount: available };
    }
    console.error("[BelKou] request withdrawal:", error.message);
    return { ok: false, reason: "Impossible d'enregistrer la demande. Réessayez plus tard." };
  }

  return { ok: true, amount: available };
}

export async function processWithdrawal(params: {
  withdrawalId: string;
  action: "paid" | "rejected";
  adminNote?: string;
}): Promise<{ ok: boolean; reason?: string }> {
  const sb = getSupabaseAdmin();
  const now = new Date().toISOString();

  if (!sb) {
    const local = devWithdrawals.get(params.withdrawalId);
    if (!local || local.status !== "pending") return { ok: false, reason: "not_found" };
    local.status = params.action === "paid" ? "paid" : "rejected";
    local.processed_at = now;
    local.admin_note = params.adminNote ?? null;
    devWithdrawals.set(params.withdrawalId, local);
    return { ok: true };
  }

  const { data: existing, error: fetchError } = await sb
    .from("affiliate_withdrawals")
    .select("*")
    .eq("id", params.withdrawalId)
    .maybeSingle();

  if (fetchError || !existing || existing.status !== "pending") {
    return { ok: false, reason: "not_found" };
  }

  const { error } = await sb
    .from("affiliate_withdrawals")
    .update({
      status: params.action === "paid" ? "paid" : "rejected",
      processed_at: now,
      admin_note: params.adminNote ?? null,
    })
    .eq("id", params.withdrawalId);

  if (error) {
    console.error("[BelKou] process withdrawal:", error.message);
    return { ok: false, reason: "update_failed" };
  }

  return { ok: true };
}
