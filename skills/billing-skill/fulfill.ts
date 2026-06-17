import type { SupabaseClient } from "@supabase/supabase-js";
import { sendGstInvoice } from "./gst-invoice";
import { attributeReferral, resolveCaPartner } from "./referral";
import type { BillingPlan } from "./types";

export interface PaymentCapturedInput {
  orderId: string;
  paymentId: string;
  amountPaise: number;
}

export async function fulfillPaidPurchase(
  supabase: SupabaseClient,
  input: PaymentCapturedInput
): Promise<{ alreadyPaid: boolean }> {
  const { data: purchase, error } = await supabase
    .from("purchases")
    .select("id, user_id, plan, amount_paise, referral_code, status, gst_invoice_sent_at")
    .eq("razorpay_order_id", input.orderId)
    .single();

  if (error || !purchase) {
    throw new Error(`Purchase not found for order ${input.orderId}`);
  }

  if (purchase.status === "paid") {
    return { alreadyPaid: true };
  }

  const paidAt = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("purchases")
    .update({
      status: "paid",
      razorpay_payment_id: input.paymentId,
      paid_at: paidAt,
    })
    .eq("id", purchase.id);

  if (updateError) {
    throw new Error(`Failed to update purchase: ${updateError.message}`);
  }

  if (purchase.referral_code) {
    const partner = await resolveCaPartner(supabase, purchase.referral_code);
    if (partner) {
      await attributeReferral(supabase, {
        caPartnerId: partner.id,
        userId: purchase.user_id,
        referralCode: purchase.referral_code,
        plan: purchase.plan as BillingPlan,
        amountPaise: purchase.amount_paise,
        commissionRate: Number(partner.commission_rate),
        razorpayOrderId: input.orderId,
      });
    }
  }

  if (!purchase.gst_invoice_sent_at) {
    const { data: user } = await supabase
      .from("users")
      .select("full_name")
      .eq("id", purchase.user_id)
      .single();

    const { data: authUser } = await supabase.auth.admin.getUserById(purchase.user_id);
    const customerEmail = authUser?.user?.email;

    if (customerEmail) {
      const sent = await sendGstInvoice({
        customerName: user?.full_name ?? "Banyan customer",
        customerEmail,
        plan: purchase.plan as BillingPlan,
        amountPaise: purchase.amount_paise,
        paymentId: input.paymentId,
        orderId: input.orderId,
      });

      if (sent) {
        await supabase
          .from("purchases")
          .update({ gst_invoice_sent_at: new Date().toISOString() })
          .eq("id", purchase.id);
      }
    }
  }

  return { alreadyPaid: false };
}