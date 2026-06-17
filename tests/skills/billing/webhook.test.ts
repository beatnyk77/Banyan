import crypto from "crypto";
import { describe, it, expect } from "vitest";
import {
  verifyPaymentSignature,
  verifyWebhookSignature,
} from "@/skills/billing-skill/razorpay";

describe("Razorpay signature verification", () => {
  const secret = "test_webhook_secret_123";

  it("accepts valid webhook signatures", () => {
    const body = JSON.stringify({ event: "payment.captured", payload: {} });
    const signature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    expect(verifyWebhookSignature(body, signature, secret)).toBe(true);
  });

  it("rejects invalid webhook signatures", () => {
    const body = JSON.stringify({ event: "payment.captured" });
    expect(verifyWebhookSignature(body, "deadbeef", secret)).toBe(false);
    expect(verifyWebhookSignature(body, "", secret)).toBe(false);
  });

  it("accepts valid checkout payment signatures", () => {
    const orderId = "order_TEST123";
    const paymentId = "pay_TEST456";
    const signature = crypto
      .createHmac("sha256", secret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    expect(
      verifyPaymentSignature({ orderId, paymentId, signature, secret })
    ).toBe(true);
  });

  it("rejects tampered payment signatures", () => {
    const orderId = "order_TEST123";
    const paymentId = "pay_TEST456";
    const signature = crypto
      .createHmac("sha256", secret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    expect(
      verifyPaymentSignature({
        orderId,
        paymentId: "pay_TAMPERED",
        signature,
        secret,
      })
    ).toBe(false);
  });
});