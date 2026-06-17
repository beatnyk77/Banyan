"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { decryptEstate } from "@/lib/intake/client-crypto";
import { generatePreviewShare2, share2ToBase64url } from "@/lib/kit/preview-share2";
import { takeShare2ForKit } from "@/lib/vault/client-vault";
import type { AssembledWill } from "@/skills/clause-assembly-skill/types";
import type { EstateJson } from "@/skills/intake-skill/estate-schema";

interface WillMeta {
  version: number;
  clause_set_hash: string;
  clause_library_version: string;
  religion_branch: string;
  status: string;
  generated_at: string;
}

export default function WillPage() {
  const [passphrase, setPassphrase] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [intakeComplete, setIntakeComplete] = useState(false);
  const [will, setWill] = useState<AssembledWill | null>(null);
  const [willMeta, setWillMeta] = useState<WillMeta | null>(null);
  const [encryptedEstate, setEncryptedEstate] = useState<string | null>(null);

  useEffect(() => {
    if (!confirmed) return;

    async function load() {
      setLoading(true);
      try {
        const [intakeRes, willRes] = await Promise.all([
          fetch("/api/intake"),
          fetch("/api/will/generate"),
        ]);

        if (!intakeRes.ok || !willRes.ok) {
          throw new Error("Failed to load will session");
        }

        const intake = await intakeRes.json();
        const willStatus = await willRes.json();

        setIntakeComplete(willStatus.intakeComplete);
        setWillMeta(willStatus.latestWill);
        setEncryptedEstate(intake.encryptedEstate ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [confirmed]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passphrase.length < 8) {
      setError("Passphrase must be at least 8 characters");
      return;
    }
    setError("");
    setConfirmed(true);
  };

  const downloadKit = async () => {
    if (!will || !encryptedEstate) {
      setError("Generate a will draft first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const estate: EstateJson = await decryptEstate(encryptedEstate, passphrase);
      const sessionShare2 = takeShare2ForKit();
      const share2 = sessionShare2 ?? (await generatePreviewShare2());
      const res = await fetch("/api/kit/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estate,
          will,
          share2ForKitB64: share2ToBase64url(share2),
          preview: !sessionShare2,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Kit download failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `banyan-execution-kit.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kit download failed");
    } finally {
      setLoading(false);
    }
  };

  const generateWill = async () => {
    if (!encryptedEstate) {
      setError("No encrypted registry found. Complete intake first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const estate: EstateJson = await decryptEstate(encryptedEstate, passphrase);
      const res = await fetch("/api/will/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estate }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Generation failed");
      }

      setWill(data.will);
      setWillMeta({
        version: data.version,
        clause_set_hash: data.will.clause_set_hash,
        clause_library_version: data.will.clause_library_version,
        religion_branch: data.will.religion_branch,
        status: "draft",
        generated_at: new Date().toISOString(),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
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
            Unlock your will draft
          </h2>
          <p style={{ fontSize: 14, color: "#555", lineHeight: 1.6, marginBottom: 20 }}>
            Enter your vault passphrase to decrypt your registry and generate a will draft
            from the approved clause library.
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
              Continue
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main style={{ padding: "40px", maxWidth: 720, margin: "0 auto" }}>
      <header style={{ marginBottom: 32, textAlign: "center" }}>
        <h2
          style={{
            fontFamily: "Cormorant Garamond, Georgia, serif",
            fontSize: 28,
            color: "#1A1814",
            fontWeight: 400,
            marginBottom: 8,
          }}
        >
          Will draft
        </h2>
        <p style={{ fontSize: 13, color: "#777", margin: 0 }}>
          Assembled from lawyer-reviewed clause templates only — AI selects IDs, never invents legal text.
        </p>
      </header>

      {!intakeComplete && (
        <div
          style={{
            padding: 20,
            border: "1px solid #DDD9D0",
            marginBottom: 24,
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 14, color: "#555", marginBottom: 12 }}>
            Complete your asset registry before generating a will.
          </p>
          <Link
            href="/intake"
            style={{
              fontSize: 13,
              color: "#B8902A",
              textDecoration: "none",
              letterSpacing: "0.04em",
            }}
          >
            Continue intake →
          </Link>
        </div>
      )}

      {intakeComplete && !will && (
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <button
            onClick={generateWill}
            disabled={loading}
            style={{
              padding: "14px 32px",
              background: loading ? "#CCC" : "#1A1814",
              color: "#F6F3EE",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: 14,
              letterSpacing: "0.04em",
            }}
          >
            {loading ? "Generating…" : willMeta ? "Regenerate draft" : "Generate will draft"}
          </button>
          {willMeta && (
            <p style={{ fontSize: 12, color: "#999", marginTop: 12 }}>
              Version {willMeta.version} on file — generate again to create a new version.
            </p>
          )}
        </div>
      )}

      {error && (
        <p style={{ fontSize: 13, color: "#C44", textAlign: "center", marginBottom: 16 }}>{error}</p>
      )}

      {will && (
        <article
          style={{
            background: "#FAF8F4",
            border: "1px solid #DDD9D0",
            padding: 32,
            lineHeight: 1.8,
            fontSize: 14,
            color: "#1A1814",
            whiteSpace: "pre-wrap",
          }}
        >
          {will.rendered_text.split("\n\n").map((para, i) => (
            <p key={i} style={{ margin: i === 0 ? 0 : "16px 0 0" }}>
              {para}
            </p>
          ))}
        </article>
      )}

      {will && (
        <div style={{ marginTop: 24, textAlign: "center" }}>
          <button
            onClick={downloadKit}
            disabled={loading}
            style={{
              padding: "12px 28px",
              background: loading ? "#CCC" : "#B8902A",
              color: "#1A1814",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: 13,
              letterSpacing: "0.04em",
              marginBottom: 16,
            }}
          >
            {loading ? "Preparing kit…" : "Download execution kit (PDF)"}
          </button>
          <footer
            style={{
              padding: 16,
              borderTop: "1px solid #DDD9D0",
              fontSize: 11,
              color: "#999",
            }}
          >
            Clause library v{will.clause_library_version} · {will.religion_branch} branch ·{" "}
            {will.clause_ids.length} clauses · hash {will.clause_set_hash.slice(0, 12)}…
            <br />
            Preview kit includes a sealed Recovery Code page. Production issuance requires lawyer
            sign-off and vault setup (PR-8).
          </footer>
        </div>
      )}
    </main>
  );
}