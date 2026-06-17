"use client";

import { useEffect, useState } from "react";
import type { BillingPlan } from "@/skills/billing-skill/types";

interface PlanOption {
  plan: BillingPlan;
  amountPaise: number;
  label: string;
}

interface PurchaseRow {
  id: string;
  plan: BillingPlan;
  amount_paise: number;
  status: string;
  paid_at: string | null;
}

export default function BillingPage() {
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadBilling = async () => {
    const res = await fetch("/api/billing/checkout");
    if (!res.ok) throw new Error("Failed to load billing");
    const data = await res.json();
    setPlans(data.plans ?? []);
    setPurchases(data.purchases ?? []);
  };

  useEffect(() => {
    loadBilling().catch((e) =>
      setError(e instanceof Error ? e.message : "Failed to load")
    );
  }, []);

  const checkout = async (plan: BillingPlan) => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          referralCode: referralCode.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");

      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Razorpay"));
        document.body.appendChild(script);
      });

      const rzp = new window.Razorpay({
        key: data.key,
        order_id: data.orderId,
        amount: data.amount,
        currency: data.currency,
        name: "Banyan",
        description: data.description,
        handler: async (response: Record<string, string>) => {
          const verifyRes = await fetch("/api/billing/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          const verifyData = await verifyRes.json();
          if (!verifyRes.ok) {
            setError(verifyData.error ?? "Payment verification failed");
            return;
          }

          setSuccess(`${data.description} — payment confirmed.`);
          await loadBilling();
        },
        theme: { color: "#B8902A" },
      });

      rzp.open();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: "40px", maxWidth: 720, margin: "0 auto" }}>
      <header style={{ marginBottom: 32 }}>
        <h2
          style={{
            fontFamily: "Cormorant Garamond, Georgia, serif",
            fontSize: 28,
            color: "#1A1814",
            fontWeight: 400,
            marginBottom: 8,
          }}
        >
          Plans & billing
        </h2>
        <p style={{ fontSize: 13, color: "#777", margin: 0 }}>
          Server-verified Razorpay checkout. CA referral codes earn 25% commission.
        </p>
      </header>

      <div style={{ marginBottom: 24 }}>
        <label style={{ fontSize: 13, color: "#555", display: "block", marginBottom: 6 }}>
          CA referral code (optional)
        </label>
        <input
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value)}
          placeholder="e.g. CA-DEMO"
          style={{
            padding: "10px 12px",
            border: "1px solid #DDD9D0",
            background: "#FAF8F4",
            fontSize: 14,
            width: "100%",
            maxWidth: 280,
          }}
        />
      </div>

      {error && <p style={{ fontSize: 13, color: "#C44", marginBottom: 16 }}>{error}</p>}
      {success && <p style={{ fontSize: 13, color: "#2A6B2A", marginBottom: 16 }}>{success}</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 40 }}>
        {plans.map((p) => (
          <article
            key={p.plan}
            style={{
              border: "1px solid #DDD9D0",
              padding: 20,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
              background: "#FAF8F4",
            }}
          >
            <div>
              <h3 style={{ fontSize: 15, color: "#1A1814", margin: "0 0 4px" }}>{p.label}</h3>
              <p style={{ fontSize: 13, color: "#777", margin: 0 }}>
                ₹{(p.amountPaise / 100).toLocaleString("en-IN")} incl. GST
              </p>
            </div>
            <button
              onClick={() => checkout(p.plan)}
              disabled={loading}
              style={{
                padding: "10px 20px",
                background: loading ? "#CCC" : "#1A1814",
                color: "#F6F3EE",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: 13,
                whiteSpace: "nowrap",
              }}
            >
              Buy now
            </button>
          </article>
        ))}
      </div>

      {purchases.length > 0 && (
        <section>
          <h3 style={{ fontSize: 15, color: "#1A1814", marginBottom: 12 }}>Purchase history</h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {purchases.map((purchase) => (
              <li
                key={purchase.id}
                style={{
                  padding: "10px 0",
                  borderBottom: "1px solid #DDD9D0",
                  fontSize: 13,
                  color: "#555",
                }}
              >
                {purchase.plan} · ₹{(purchase.amount_paise / 100).toLocaleString("en-IN")} ·{" "}
                {purchase.status}
                {purchase.paid_at
                  ? ` · ${new Date(purchase.paid_at).toLocaleDateString()}`
                  : ""}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}