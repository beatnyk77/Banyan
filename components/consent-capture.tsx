"use client";

import { useState } from "react";

interface ConsentCaptureProps {
  onConsent: () => void;
}

export function ConsentCapture({ onConsent }: ConsentCaptureProps) {
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!checked || loading) return;
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purpose: "succession_document_generation" }),
    });

    if (!res.ok) {
      setError("Could not record consent. Please try again.");
      setLoading(false);
      return;
    }

    onConsent();
  };

  return (
    <div
      style={{
        background: "#F6F3EE",
        border: "1px solid #B8902A",
        padding: 24,
        maxWidth: 500,
      }}
    >
      <h3
        style={{
          fontFamily: "Cormorant Garamond, serif",
          color: "#1A1814",
          marginTop: 0,
        }}
      >
        Data Processing Consent
      </h3>
      <p style={{ fontSize: 14, color: "#1A1814", lineHeight: 1.6 }}>
        Under the Digital Personal Data Protection Act, 2023, we are required to obtain your
        explicit consent before processing your personal data.
      </p>
      <p style={{ fontSize: 13, color: "#555", lineHeight: 1.6 }}>
        <strong>Purpose:</strong> Succession document generation — building a registry of your
        assets and generating a will-ready document and execution kit.
      </p>
      <p style={{ fontSize: 13, color: "#555" }}>
        <strong>Data collected:</strong> Name, date of birth, religion (for applicable succession
        law), family details, asset information, and nominee details.
      </p>
      <label
        style={{
          display: "flex",
          gap: 8,
          alignItems: "flex-start",
          marginTop: 16,
          fontSize: 13,
        }}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          style={{ marginTop: 2 }}
        />
        I consent to Banyan (FoundersHQ LLP) processing my personal data for the purpose of
        succession document generation.
      </label>
      {error && (
        <p style={{ fontSize: 13, color: "#C44", marginTop: 12, marginBottom: 0 }}>{error}</p>
      )}
      <button
        onClick={submit}
        disabled={!checked || loading}
        style={{
          marginTop: 16,
          padding: "10px 24px",
          background: checked && !loading ? "#1A1814" : "#ccc",
          color: "#F6F3EE",
          border: "none",
          cursor: checked && !loading ? "pointer" : "not-allowed",
        }}
      >
        {loading ? "Recording…" : "I Consent — Continue"}
      </button>
    </div>
  );
}