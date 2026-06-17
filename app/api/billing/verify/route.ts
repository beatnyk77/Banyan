import { NextRequest, NextResponse } from "next/server";
import { fulfillPaidPurchase } from "@/skills/billing-skill/fulfill";
import { verifyPaymentSignature } from "@/skills/billing-skill/razorpay";
import { createServerSupabaseClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const orderId = body.razorpay_order_id as string;
  const paymentId = body.razorpay_payment_id as string;
  const signature = body.razorpay_signature as string;

  if (!orderId || !paymentId || !signature) {
    return NextResponse.json({ error: "Missing payment fields" }, { status: 400 });
  }

  const secret = process.env.RAZORPAY_KEY_SECRET ?? "";
  if (!verifyPaymentSignature({ orderId, paymentId, signature, secret })) {
    return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
  }

  const service = createServiceClient();
  const { data: purchase } = await service
    .from("purchases")
    .select("user_id, amount_paise")
    .eq("razorpay_order_id", orderId)
    .single();

  if (!purchase || purchase.user_id !== user.id) {
    return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
  }

  try {
    const result = await fulfillPaidPurchase(service, {
      orderId,
      paymentId,
      amountPaise: purchase.amount_paise,
    });

    return NextResponse.json({ verified: true, alreadyPaid: result.alreadyPaid });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Verification failed" },
      { status: 500 }
    );
  }
}