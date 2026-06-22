"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function VetoPage() {
  const params = useParams<{ token: string }>();
  const token = decodeURIComponent(params.token);

  const [canVeto, setCanVeto] = useState(false);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/nominees/veto?token=${encodeURIComponent(token)}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Invalid veto link");
        setCanVeto(json.canVeto);
        setStatus(json.status);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  const submitVeto = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/nominees/veto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Veto failed");
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Veto failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main
      style={{
        background: "#F6F3EE",
        minHeight: "100vh",
        padding: "48px 24px",
        fontFamily: "Barlow, sans-serif",
      }}
    >
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <Link href="/" style={{ fontSize: 12, color: "#777", textDecoration: "none" }}>
          ← Banyan
        </Link>

        <h1
          style={{
            fontFamily: "Cormorant Garamond, Georgia, serif",
            fontSize: 28,
            color: "#1A1814",
            fontWeight: 400,
            marginTop: 24,
          }}
        >
          Release veto
        </h1>

        {loading && <p style={{ color: "#555" }}>Loading…</p>}

        {!loading && done && (
          <p style={{ color: "#2A6", lineHeight: 1.6 }}>
            Your veto has been recorded. The release request has been rejected.
          </p>
        )}

        {!loading && !done && (
          <>
            <p style={{ color: "#555", lineHeight: 1.6 }}>
              Another nominee has requested emergency access to an estate vault. As a
              verified nominee, you may veto this release during the 7-day time-lock period.
            </p>
            {status && (
              <p style={{ fontSize: 14, marginTop: 16 }}>
                Current status: <strong>{status.replace(/_/g, " ")}</strong>
              </p>
            )}
            {canVeto ? (
              <button
                type="button"
                onClick={submitVeto}
                disabled={submitting}
                style={{
                  marginTop: 20,
                  padding: "12px 24px",
                  background: "#1A1814",
                  color: "#F6F3EE",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                {submitting ? "Submitting…" : "Veto this release request"}
              </button>
            ) : (
              !error && (
                <p style={{ fontSize: 13, color: "#777", marginTop: 16 }}>
                  Veto is not available for the current release status.
                </p>
              )
            )}
          </>
        )}

        {error && <p style={{ color: "#C44", fontSize: 13, marginTop: 16 }}>{error}</p>}
      </div>
    </main>
  );
}