"use client";
import { useState } from "react";
import Link from "next/link";
import { IntakeDemo } from "../../../components/intake-demo";

export default function DemoPage() {
  const [showCta, setShowCta] = useState(false);

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
          style={{
            fontSize: 12,
            color: "#777",
            textDecoration: "none",
            letterSpacing: "0.06em",
          }}
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
          10-question demo
        </h2>
        <p style={{ fontSize: 13, color: "#777", margin: 0 }}>
          Answer naturally. Banyan will sketch your asset registry.
        </p>
      </header>

      <IntakeDemo onComplete={() => setShowCta(true)} />

      {showCta && (
        <div
          style={{
            textAlign: "center",
            marginTop: 32,
            padding: "24px",
            border: "1px solid #B8902A",
            background: "#FAF8F4",
          }}
        >
          <p
            style={{
              fontFamily: "Cormorant Garamond, Georgia, serif",
              fontSize: 20,
              color: "#1A1814",
              marginBottom: 16,
            }}
          >
            Ready to build the full registry?
          </p>
          <Link
            href="/pre-order"
            style={{
              background: "#B8902A",
              color: "#1A1814",
              padding: "12px 36px",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: 14,
              letterSpacing: "0.04em",
              display: "inline-block",
            }}
          >
            Pre-order Banyan — ₹1,999
          </Link>
          <p style={{ fontSize: 12, color: "#999", marginTop: 12 }}>
            Early access · Will document + execution kit included
          </p>
        </div>
      )}
    </main>
  );
}
