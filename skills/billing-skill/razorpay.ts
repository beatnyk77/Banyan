import crypto from "crypto";
import Razorpay from "razorpay";
import type { BillingPlan } from "./types";
import { PLAN_PRICES_PAISE } from "./types";

export function createRazorpayClient(): Razorpay {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });
}

export function getPlanAmountPaise(plan: BillingPlan): number {
  return PLAN_PRICES_PAISE[plan];
}

export function getPlanLabel(plan: BillingPlan): string {
  const labels: Record<BillingPlan, string> = {
    will: "Will document + execution kit",
    vault_annual: "Encrypted vault (annual)",
    family_annual: "Family plan — 2 parents (annual)",
  };
  return labels[plan];
}

export function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  if (!signature || !secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(signature, "hex")
    );
  } catch {
    return false;
  }
}

export function verifyPaymentSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
  secret: string;
}): boolean {
  const { orderId, paymentId, signature, secret } = params;
  if (!orderId || !paymentId || !signature || !secret) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(signature, "hex")
    );
  } catch {
    return false;
  }
}

export async function createRazorpayOrder(params: {
  plan: BillingPlan;
  userId: string;
  email: string;
  referralCode?: string;
}): Promise<{ id: string; amount: number; currency: string }> {
  const razorpay = createRazorpayClient();
  const amount = getPlanAmountPaise(params.plan);

  const order = await razorpay.orders.create({
    amount,
    currency: "INR",
    notes: {
      plan: params.plan,
      user_id: params.userId,
      email: params.email,
      referral_code: params.referralCode ?? "",
    },
  });

  return {
    id: order.id,
    amount: Number(order.amount),
    currency: order.currency,
  };
}