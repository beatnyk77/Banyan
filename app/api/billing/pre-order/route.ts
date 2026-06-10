import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const { name, email, phone, referralCode } = await req.json();

  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "name and email are required" }, { status: 400 });
  }

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });

  const order = await razorpay.orders.create({
    amount: 199900, // ₹1,999 in paise
    currency: "INR",
    notes: {
      name,
      email,
      phone: phone ?? "",
      referral_code: referralCode ?? "",
    },
  });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await supabase.from("pre_orders").insert({
    name,
    email,
    phone: phone ?? null,
    referral_code: referralCode ?? null,
    razorpay_order_id: order.id,
    amount_paise: 199900,
    status: "pending",
  });

  return NextResponse.json({
    orderId: order.id,
    key: process.env.RAZORPAY_KEY_ID,
  });
}
