"use client";
import { useState } from "react";
import Link from "next/link";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open(): void };
  }
}

export default function PreOrderPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", referralCode: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/billing/pre-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");

      // Load Razorpay checkout
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => {
        const rzp = new window.Razorpay({
          key: data.key,
          order_id: data.orderId,
          amount: 199900,
          currency: "INR",
          name: "Banyan",
          description: "Pre-order — Will document + execution kit",
          prefill: { name: form.name, email: form.email, contact: form.phone },
          theme: { color: "#B8902A" },
          handler: () => setSuccess(true),
        });
        rzp.open();
        setLoading(false);
      };
      document.body.appendChild(script);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main
        style={{
          background: "#F6F3EE",
          minHeight: "100vh",
          padding: "80px 40px",
          fontFamily: "Barlow, sans-serif",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontFamily: "Cormorant Garamond, Georgia, serif",
            fontSize: 32,
            color: "#1A1814",
            fontWeight: 400,
          }}
        >
          Pre-order confirmed.
        </h2>
        <p style={{ fontSize: 15, color: "#555", marginTop: 16, lineHeight: 1.7 }}>
          We have your details, {form.name.split(" ")[0]}. You will receive a confirmation
          email shortly. We will reach out when Banyan is ready for you.
        </p>
        <p style={{ fontSize: 13, color: "#999", marginTop: 8 }}>
          Questions? Write to us at hello@banyan.fo
        </p>
      </main>
    );
  }

  return (
    <main
      style={{
        background: "#F6F3EE",
        minHeight: "100vh",
        padding: "40px",
        fontFamily: "Barlow, sans-serif",
      }}
    >
      <header style={{ marginBottom: 32 }}>
        <Link
          href="/"
          style={{ fontSize: 12, color: "#777", textDecoration: "none", letterSpacing: "0.06em" }}
        >
          ← Banyan
        </Link>
        <h2
          style={{
            fontFamily: "Cormorant Garamond, Georgia, serif",
            fontSize: 26,
            color: "#1A1814",
            fontWeight: 400,
            marginTop: 16,
            marginBottom: 6,
          }}
        >
          Pre-order Banyan
        </h2>
        <p style={{ fontSize: 13, color: "#777", margin: 0 }}>
          Early access · ₹1,999 one-time · Will document + execution kit included
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        style={{ maxWidth: 480, display: "flex", flexDirection: "column", gap: 16 }}
      >
        <div>
          <label style={{ fontSize: 12, color: "#555", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>
            FULL NAME *
          </label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            style={inputStyle}
            placeholder="Ramesh Kumar Sharma"
          />
        </div>
        <div>
          <label style={{ fontSize: 12, color: "#555", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>
            EMAIL *
          </label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            style={inputStyle}
            placeholder="ramesh@example.com"
          />
        </div>
        <div>
          <label style={{ fontSize: 12, color: "#555", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>
            PHONE (optional)
          </label>
          <input
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            style={inputStyle}
            placeholder="+91 98765 43210"
          />
        </div>
        <div>
          <label style={{ fontSize: 12, color: "#555", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>
            REFERRAL CODE (optional)
          </label>
          <input
            name="referralCode"
            value={form.referralCode}
            onChange={handleChange}
            style={inputStyle}
            placeholder="CA code if any"
          />
        </div>

        {error && (
          <p style={{ fontSize: 13, color: "#C44", margin: 0 }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !form.name || !form.email}
          style={{
            marginTop: 8,
            padding: "12px 32px",
            background: loading || !form.name || !form.email ? "#CCC" : "#1A1814",
            color: "#F6F3EE",
            border: "none",
            cursor: loading || !form.name || !form.email ? "not-allowed" : "pointer",
            fontSize: 14,
            letterSpacing: "0.04em",
          }}
        >
          {loading ? "Opening payment…" : "Continue to payment — ₹1,999"}
        </button>

        <p style={{ fontSize: 11, color: "#999", lineHeight: 1.5 }}>
          Payments are processed securely by Razorpay. GST invoice will be issued
          by FoundersHQ LLP under your registered email.
        </p>
      </form>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #DDD9D0",
  background: "#FAF8F4",
  fontSize: 14,
  color: "#1A1814",
  outline: "none",
  boxSizing: "border-box",
};
