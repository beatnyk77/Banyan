"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

interface ReleaseEvent {
  id: string;
  status: string;
  time_lock_expires_at: string | null;
  created_at: string;
}

interface NomineeStatus {
  nominee: { id: string; full_name: string; kyc_status: string };
  release_events: ReleaseEvent[];
  digilocker_configured: boolean;
}

function NomineeInviteContent() {
  const params = useParams<{ token: string }>();
  const searchParams = useSearchParams();
  const token = decodeURIComponent(params.token);

  const [data, setData] = useState<NomineeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/nominees/public?token=${encodeURIComponent(token)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load invite");
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
    if (searchParams.get("kyc") === "verified") {
      setSuccess("Identity verified via DigiLocker.");
    }
    const kycError = searchParams.get("error");
    if (kycError) {
      setError(`KYC error: ${kycError.replace(/_/g, " ")}`);
    }
  }, [load, searchParams]);

  const startKyc = () => {
    window.location.href = `/api/nominees/kyc/start?token=${encodeURIComponent(token)}`;
  };

  const requestRelease = async () => {
    setActionLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/nominees/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, action: "request_release" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Request failed");
      setSuccess("Release request submitted. The estate owner will be notified.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setActionLoading(false);
    }
  };

  const pageStyle: React.CSSProperties = {
    background: "#F6F3EE",
    minHeight: "100vh",
    padding: "48px 24px",
    fontFamily: "Barlow, sans-serif",
  };

  if (loading) {
    return (
      <main style={pageStyle}>
        <p style={{ color: "#555", textAlign: "center" }}>Loading your invite…</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main style={pageStyle}>
        <div style={{ maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
          <h1 style={headingStyle}>Invite not found</h1>
          <p style={{ color: "#555" }}>{error || "This link may have expired."}</p>
          <Link href="/" style={linkStyle}>
            ← Banyan
          </Link>
        </div>
      </main>
    );
  }

  const { nominee, release_events, digilocker_configured } = data;
  const kycVerified = nominee.kyc_status === "kyc_verified";
  const activeRelease = release_events.find(
    (e) => e.status !== "rejected" && e.status !== "completed"
  );

  return (
    <main style={pageStyle}>
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <Link href="/" style={{ ...linkStyle, fontSize: 12 }}>
          ← Banyan
        </Link>

        <h1 style={{ ...headingStyle, marginTop: 24 }}>Nominee portal</h1>
        <p style={{ color: "#555", lineHeight: 1.6 }}>
          Hello {nominee.full_name}. You have been named as a nominee for a Banyan estate
          vault.
        </p>

        <section style={cardStyle}>
          <h2 style={subheadingStyle}>Verification status</h2>
          <p style={{ margin: "8px 0", fontSize: 14 }}>
            KYC: <strong>{nominee.kyc_status.replace(/_/g, " ")}</strong>
          </p>
          {!kycVerified && (
            <>
              {digilocker_configured ? (
                <button type="button" onClick={startKyc} style={primaryBtn}>
                  Verify with DigiLocker
                </button>
              ) : (
                <p style={{ fontSize: 13, color: "#777" }}>
                  Identity verification is being set up. The estate owner will contact you.
                </p>
              )}
            </>
          )}
        </section>

        <section style={cardStyle}>
          <h2 style={subheadingStyle}>Emergency release</h2>
          {activeRelease ? (
            <div style={{ fontSize: 14, lineHeight: 1.6 }}>
              <p>
                Active request: <strong>{activeRelease.status.replace(/_/g, " ")}</strong>
              </p>
              {activeRelease.time_lock_expires_at && (
                <p style={{ color: "#777" }}>
                  Time-lock expires:{" "}
                  {new Date(activeRelease.time_lock_expires_at).toLocaleString()}
                </p>
              )}
            </div>
          ) : kycVerified ? (
            <button
              type="button"
              onClick={requestRelease}
              disabled={actionLoading}
              style={primaryBtn}
            >
              {actionLoading ? "Submitting…" : "Request emergency release"}
            </button>
          ) : (
            <p style={{ fontSize: 13, color: "#777" }}>
              Complete identity verification before requesting release.
            </p>
          )}
        </section>

        {error && <p style={{ color: "#C44", fontSize: 13 }}>{error}</p>}
        {success && <p style={{ color: "#2A6", fontSize: 13 }}>{success}</p>}
      </div>
    </main>
  );
}

const headingStyle: React.CSSProperties = {
  fontFamily: "Cormorant Garamond, Georgia, serif",
  fontSize: 28,
  color: "#1A1814",
  fontWeight: 400,
};

const subheadingStyle: React.CSSProperties = {
  fontFamily: "Cormorant Garamond, Georgia, serif",
  fontSize: 20,
  color: "#1A1814",
  fontWeight: 400,
  margin: "0 0 12px",
};

const cardStyle: React.CSSProperties = {
  background: "#FAF8F4",
  border: "1px solid #DDD9D0",
  padding: "20px 24px",
  marginTop: 20,
};

const primaryBtn: React.CSSProperties = {
  marginTop: 12,
  padding: "10px 20px",
  background: "#1A1814",
  color: "#F6F3EE",
  border: "none",
  cursor: "pointer",
  fontSize: 14,
};

const linkStyle: React.CSSProperties = {
  color: "#777",
  textDecoration: "none",
};

export default function NomineeInvitePage() {
  return (
    <Suspense
      fallback={
        <main style={{ background: "#F6F3EE", minHeight: "100vh", padding: "48px 24px" }}>
          <p style={{ textAlign: "center", color: "#555" }}>Loading your invite…</p>
        </main>
      }
    >
      <NomineeInviteContent />
    </Suspense>
  );
}