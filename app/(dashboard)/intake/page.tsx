"use client";

import { useState } from "react";
import { IntakeChat } from "@/components/intake-chat";

export default function IntakePage() {
  const [passphrase, setPassphrase] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passphrase.length < 8) {
      setError("Passphrase must be at least 8 characters");
      return;
    }
    setError("");
    setConfirmed(true);
  };

  if (!confirmed) {
    return (
      <main style={{ padding: "40px" }}>
        <div style={{ maxWidth: 440, margin: "0 auto" }}>
          <h2
            style={{
              fontFamily: "Cormorant Garamond, Georgia, serif",
              fontSize: 26,
              color: "#1A1814",
              fontWeight: 400,
              marginBottom: 8,
            }}
          >
            Unlock your registry
          </h2>
          <p style={{ fontSize: 14, color: "#555", lineHeight: 1.6, marginBottom: 20 }}>
            Enter your vault passphrase to encrypt and decrypt your asset registry. This stays
            in your browser session only — Banyan never sees your passphrase.
          </p>
          <form onSubmit={handleUnlock} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="Vault passphrase"
              style={{
                padding: "10px 12px",
                border: "1px solid #B8902A",
                background: "#FAF8F4",
                fontSize: 14,
                outline: "none",
              }}
            />
            {error && <p style={{ fontSize: 13, color: "#C44", margin: 0 }}>{error}</p>}
            <button
              type="submit"
              style={{
                padding: "12px 24px",
                background: "#1A1814",
                color: "#F6F3EE",
                border: "none",
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              Begin intake
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main style={{ padding: "32px 40px" }}>
      <header style={{ marginBottom: 24, textAlign: "center" }}>
        <h2
          style={{
            fontFamily: "Cormorant Garamond, Georgia, serif",
            fontSize: 26,
            color: "#1A1814",
            fontWeight: 400,
            marginBottom: 6,
          }}
        >
          Build your asset registry
        </h2>
        <p style={{ fontSize: 13, color: "#777", margin: 0 }}>
          Answer naturally. Your registry is encrypted before it leaves this device.
        </p>
      </header>
      <IntakeChat passphrase={passphrase} />
    </main>
  );
}