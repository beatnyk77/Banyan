import { NextRequest, NextResponse } from "next/server";
import { fulfillPaidPurchase } from "@/skills/billing-skill/fulfill";
import { verifyWebhookSignature } from "@/skills/billing-skill/razorpay";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? "";

  if (!verifyWebhookSignature(body, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(body) as {
    event: string;
    payload?: { payment?: { entity?: { id: string; order_id: string; amount: number } } };
  };

  if (event.event !== "payment.captured") {
    return NextResponse.json({ received: true, skipped: true });
  }

  const payment = event.payload?.payment?.entity;
  if (!payment?.order_id || !payment.id) {
    return NextResponse.json({ error: "Invalid payment payload" }, { status: 400 });
  }

  try {
    const service = createServiceClient();
    await fulfillPaidPurchase(service, {
      orderId: payment.order_id,
      paymentId: payment.id,
      amountPaise: payment.amount,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Fulfillment failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}