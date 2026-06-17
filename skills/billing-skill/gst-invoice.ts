import type { BillingPlan } from "./types";
import { getPlanLabel } from "./razorpay";

const GST_RATE = 0.18;

export interface GstInvoiceInput {
  customerName: string;
  customerEmail: string;
  plan: BillingPlan;
  amountPaise: number;
  paymentId: string;
  orderId: string;
}

export function computeGstBreakdown(amountPaise: number): {
  taxablePaise: number;
  gstPaise: number;
  totalPaise: number;
} {
  const totalPaise = amountPaise;
  const taxablePaise = Math.round(totalPaise / (1 + GST_RATE));
  const gstPaise = totalPaise - taxablePaise;
  return { taxablePaise, gstPaise, totalPaise };
}

export function formatInr(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

export function buildGstInvoiceEmail(input: GstInvoiceInput): {
  subject: string;
  text: string;
} {
  const { taxablePaise, gstPaise, totalPaise } = computeGstBreakdown(input.amountPaise);
  const invoiceDate = new Date().toISOString().split("T")[0];

  return {
    subject: `Banyan tax invoice — ${getPlanLabel(input.plan)}`,
    text: [
      `Tax Invoice`,
      `Date: ${invoiceDate}`,
      ``,
      `Bill to: ${input.customerName} <${input.customerEmail}>`,
      `Plan: ${getPlanLabel(input.plan)}`,
      ``,
      `Taxable amount: ${formatInr(taxablePaise)}`,
      `GST (18%): ${formatInr(gstPaise)}`,
      `Total paid: ${formatInr(totalPaise)}`,
      ``,
      `Razorpay order: ${input.orderId}`,
      `Razorpay payment: ${input.paymentId}`,
      ``,
      `Banyan — Founder's Office & Co`,
      `GSTIN: [placeholder — update before production]`,
    ].join("\n"),
  };
}

export async function sendGstInvoice(input: GstInvoiceInput): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  const email = buildGstInvoiceEmail(input);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Banyan <billing@banyan.fo>",
      to: input.customerEmail,
      subject: email.subject,
      text: email.text,
    }),
  });

  return res.ok;
}