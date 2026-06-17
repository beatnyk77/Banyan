import type { SupabaseClient } from "@supabase/supabase-js";
import type { BillingPlan } from "./types";

export interface CaPartnerRow {
  id: string;
  name: string;
  email: string;
  referral_code: string;
  commission_rate: number;
  payout_ledger: unknown;
}

export function normalizeReferralCode(code: string): string {
  return code.trim().toUpperCase();
}

export function computeCommission(amountPaise: number, commissionRate: number): number {
  return Math.round(amountPaise * commissionRate);
}

export async function resolveCaPartner(
  supabase: SupabaseClient,
  referralCode: string
): Promise<CaPartnerRow | null> {
  const normalized = normalizeReferralCode(referralCode);
  if (!normalized) return null;

  const { data } = await supabase
    .from("ca_partners")
    .select("id, name, email, referral_code, commission_rate, payout_ledger")
    .eq("referral_code", normalized)
    .maybeSingle();

  return (data as CaPartnerRow | null) ?? null;
}

export interface ReferralAttributionInput {
  caPartnerId: string;
  userId: string;
  referralCode: string;
  plan: BillingPlan;
  amountPaise: number;
  commissionRate: number;
  razorpayOrderId: string;
}

export function buildReferralInsert(input: ReferralAttributionInput) {
  const commission = computeCommission(input.amountPaise, input.commissionRate);
  return {
    ca_partner_id: input.caPartnerId,
    user_id: input.userId,
    referral_code: normalizeReferralCode(input.referralCode),
    plan_purchased: input.plan,
    amount_paid_paise: input.amountPaise,
    commission_amount_paise: commission,
    commission_status: "pending" as const,
    razorpay_order_id: input.razorpayOrderId,
  };
}

export function appendPayoutLedgerEntry(
  ledger: unknown,
  entry: {
    referralId: string;
    userId: string;
    plan: BillingPlan;
    commissionPaise: number;
    razorpayOrderId: string;
  }
): unknown[] {
  const existing = Array.isArray(ledger) ? ledger : [];
  return [
    ...existing,
    {
      referral_id: entry.referralId,
      user_id: entry.userId,
      plan: entry.plan,
      commission_paise: entry.commissionPaise,
      razorpay_order_id: entry.razorpayOrderId,
      recorded_at: new Date().toISOString(),
    },
  ];
}

export async function attributeReferral(
  supabase: SupabaseClient,
  input: ReferralAttributionInput
): Promise<{ referralId: string; commissionPaise: number } | null> {
  const { data: existing } = await supabase
    .from("referrals")
    .select("id, commission_amount_paise")
    .eq("razorpay_order_id", input.razorpayOrderId)
    .maybeSingle();

  if (existing) {
    return {
      referralId: existing.id,
      commissionPaise: existing.commission_amount_paise,
    };
  }

  const insert = buildReferralInsert(input);

  const { data: referral, error } = await supabase
    .from("referrals")
    .insert(insert)
    .select("id, commission_amount_paise")
    .single();

  if (error || !referral) {
    throw new Error(`Referral attribution failed: ${error?.message ?? "unknown"}`);
  }

  const { data: partner } = await supabase
    .from("ca_partners")
    .select("payout_ledger")
    .eq("id", input.caPartnerId)
    .single();

  const updatedLedger = appendPayoutLedgerEntry(partner?.payout_ledger, {
    referralId: referral.id,
    userId: input.userId,
    plan: input.plan,
    commissionPaise: referral.commission_amount_paise,
    razorpayOrderId: input.razorpayOrderId,
  });

  await supabase
    .from("ca_partners")
    .update({ payout_ledger: updatedLedger, updated_at: new Date().toISOString() })
    .eq("id", input.caPartnerId);

  return {
    referralId: referral.id,
    commissionPaise: referral.commission_amount_paise,
  };
}