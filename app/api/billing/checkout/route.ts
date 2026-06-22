import { NextRequest, NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import {
  createRazorpayOrder,
  getPlanAmountPaise,
  getPlanLabel,
} from "@/skills/billing-skill/razorpay";
import { normalizeReferralCode, resolveCaPartner } from "@/skills/billing-skill/referral";
import type { BillingPlan } from "@/skills/billing-skill/types";
import { PLAN_PRICES_PAISE } from "@/skills/billing-skill/types";
import { createServerSupabaseClient, createServiceClient } from "@/lib/supabase/server";

const PLANS = Object.keys(PLAN_PRICES_PAISE) as BillingPlan[];

async function requireUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const plan = body.plan as BillingPlan;
  const referralCode = body.referralCode as string | undefined;

  if (!plan || !PLANS.includes(plan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const service = createServiceClient();

  if (referralCode?.trim()) {
    const partner = await resolveCaPartner(service, referralCode);
    if (!partner) {
      return NextResponse.json({ error: "Invalid referral code" }, { status: 400 });
    }
  }

  try {
    const order = await createRazorpayOrder({
      plan,
      userId: user.id,
      email: user.email ?? "",
      referralCode: referralCode ? normalizeReferralCode(referralCode) : undefined,
    });

    const { error: insertError } = await service.from("purchases").insert({
      user_id: user.id,
      plan,
      amount_paise: getPlanAmountPaise(plan),
      razorpay_order_id: order.id,
      referral_code: referralCode ? normalizeReferralCode(referralCode) : null,
      status: "pending",
    });

    if (insertError) {
      return NextResponse.json(
        { error: `Failed to record purchase: ${insertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: getServerEnv().RAZORPAY_KEY_ID,
      plan,
      description: getPlanLabel(plan),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Checkout failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = createServiceClient();
  const { data } = await service
    .from("purchases")
    .select("id, plan, amount_paise, status, paid_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({
    plans: PLANS.map((plan) => ({
      plan,
      amountPaise: PLAN_PRICES_PAISE[plan],
      label: getPlanLabel(plan),
    })),
    purchases: data ?? [],
  });
}