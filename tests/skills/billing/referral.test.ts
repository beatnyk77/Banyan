import { describe, it, expect } from "vitest";
import {
  appendPayoutLedgerEntry,
  buildReferralInsert,
  computeCommission,
  normalizeReferralCode,
} from "@/skills/billing-skill/referral";
import { computeGstBreakdown, formatInr } from "@/skills/billing-skill/gst-invoice";
import { PLAN_PRICES_PAISE } from "@/skills/billing-skill/types";

describe("Referral attribution", () => {
  it("normalizes referral codes to uppercase", () => {
    expect(normalizeReferralCode(" ca-demo ")).toBe("CA-DEMO");
  });

  it("computes 25% commission on will plan", () => {
    const amount = PLAN_PRICES_PAISE.will;
    expect(computeCommission(amount, 0.25)).toBe(Math.round(amount * 0.25));
  });

  it("builds referral insert payload", () => {
    const row = buildReferralInsert({
      caPartnerId: "partner-1",
      userId: "user-1",
      referralCode: "ca-demo",
      plan: "will",
      amountPaise: 249900,
      commissionRate: 0.25,
      razorpayOrderId: "order_abc",
    });

    expect(row.referral_code).toBe("CA-DEMO");
    expect(row.commission_amount_paise).toBe(62475);
    expect(row.plan_purchased).toBe("will");
    expect(row.commission_status).toBe("pending");
  });

  it("appends payout ledger entries immutably", () => {
    const first = appendPayoutLedgerEntry([], {
      referralId: "ref-1",
      userId: "user-1",
      plan: "will",
      commissionPaise: 62475,
      razorpayOrderId: "order_abc",
    });

    expect(first).toHaveLength(1);
    expect((first[0] as { commission_paise: number }).commission_paise).toBe(62475);

    const second = appendPayoutLedgerEntry(first, {
      referralId: "ref-2",
      userId: "user-2",
      plan: "vault_annual",
      commissionPaise: 17475,
      razorpayOrderId: "order_def",
    });

    expect(second).toHaveLength(2);
  });
});

describe("GST invoice helpers", () => {
  it("splits GST from tax-inclusive amount", () => {
    const { totalPaise, taxablePaise, gstPaise } = computeGstBreakdown(249900);
    expect(totalPaise).toBe(249900);
    expect(taxablePaise + gstPaise).toBe(totalPaise);
    expect(gstPaise).toBeGreaterThan(0);
  });

  it("formats INR from paise", () => {
    expect(formatInr(249900)).toContain("2,499");
  });
});