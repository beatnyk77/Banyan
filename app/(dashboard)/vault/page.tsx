"use client";

import { useEffect, useState } from "react";
import { performKeyCeremony } from "@/skills/vault-skill/key-ceremony";
import type { VaultKeyPacket } from "@/lib/crypto/types";
import {
  encryptFileForVault,
  reconstructVaultKey,
  stashShare2ForKit,
  takeShare2ForKit,
} from "@/lib/vault/client-vault";
import { share2ToBase64url } from "@/lib/kit/preview-share2";

interface VaultDocument {
  id: string;
  doc_type: string;
  file_name: string;
  file_size_bytes: number | null;
  created_at: string;
}

interface NomineeRow {
  id: string;
  full_name: string;
  email: string;
  kyc_status: string;
  invite_token: string;
}

interface ReleaseEventRow {
  id: string;
  status: string;
  time_lock_expires_at: string | null;
}

export default function VaultPage() {
  const [passphrase, setPassphrase] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [configured, setConfigured] = useState(false);
  const [packet, setPacket] = useState<VaultKeyPacket | null>(null);
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [nominees, setNominees] = useState<NomineeRow[]>([]);
  const [releaseEvents, setReleaseEvents] = useState<ReleaseEventRow[]>([]);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [share2Ready, setShare2Ready] = useState(false);

  const loadVaultState = async () => {
    const [setupRes, docsRes, nomineesRes] = await Promise.all([
      fetch("/api/vault/setup"),
      fetch("/api/vault/upload"),
      fetch("/api/nominees"),
    ]);

    if (!setupRes.ok || !docsRes.ok || !nomineesRes.ok) {
      throw new Error("Failed to load vault state");
    }

    const setup = await setupRes.json();
    const docs = await docsRes.json();
    const nomineeData = await nomineesRes.json();

    setConfigured(setup.configured);
    setPacket(setup.packet ?? null);
    setDocuments(docs.documents ?? []);
    setNominees(nomineeData.nominees ?? []);
    setReleaseEvents(nomineeData.releaseEvents ?? []);
    setShare2Ready(Boolean(takeShare2ForKit()));
  };

  useEffect(() => {
    if (!confirmed) return;
    setLoading(true);
    loadVaultState()
      .catch((e) => setError(e instanceof Error ? e.message : "Load failed"))
      .finally(() => setLoading(false));
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

  const setupVault = async () => {
    const escrowPubkey = process.env.NEXT_PUBLIC_BANYAN_ESCROW_PUBKEY;
    if (!escrowPubkey) {
      setError("Vault setup requires NEXT_PUBLIC_BANYAN_ESCROW_PUBKEY");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await performKeyCeremony({
        passphrase,
        escrowPublicKeyHex: escrowPubkey,
      });

      stashShare2ForKit(result.share2ForKit);
      setShare2Ready(true);

      const res = await fetch("/api/vault/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packet: result.packet }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Vault setup failed");

      await loadVaultState();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Vault setup failed");
    } finally {
      setLoading(false);
    }
  };

  const uploadDocument = async (file: File) => {
    if (!packet) {
      setError("Vault not configured");
      return;
    }

    const share2 = takeShare2ForKit();
    if (!share2) {
      setError(
        "Recovery share not in session. Re-run vault setup or use your kit QR share during this session."
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const vaultKey = await reconstructVaultKey({ passphrase, packet, share2 });
      stashShare2ForKit(share2);

      const { ciphertext, envelope } = await encryptFileForVault(file, vaultKey);
      const res = await fetch("/api/vault/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          docType: "other",
          envelope,
          ciphertextB64: btoa(String.fromCharCode(...ciphertext)),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");

      await loadVaultState();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const inviteNominee = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/nominees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "invite",
          fullName: inviteName,
          email: inviteEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Invite failed");

      setInviteName("");
      setInviteEmail("");
      await loadVaultState();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invite failed");
    } finally {
      setLoading(false);
    }
  };

  const advanceRelease = async (releaseEventId: string, nextStatus: string) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/nominees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "advance_release", releaseEventId, nextStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Transition failed");

      await loadVaultState();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transition failed");
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
            Unlock your vault
          </h2>
          <p style={{ fontSize: 14, color: "#555", lineHeight: 1.6, marginBottom: 20 }}>
            Your vault passphrase decrypts Shamir Share 1. Share 2 lives only in your execution
            kit — never in our database.
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
    <main style={{ padding: "40px", maxWidth: 800, margin: "0 auto" }}>
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
          Encrypted vault
        </h2>
        <p style={{ fontSize: 13, color: "#777", margin: 0 }}>
          Documents are encrypted client-side before upload. Share 2 is embedded in your kit only.
        </p>
      </header>

      {error && (
        <p style={{ fontSize: 13, color: "#C44", marginBottom: 16 }}>{error}</p>
      )}

      {!configured && (
        <section
          style={{
            padding: 24,
            border: "1px solid #B8902A",
            marginBottom: 32,
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 14, color: "#555", marginBottom: 16 }}>
            Run the key ceremony to create your 2-of-3 Shamir vault keys.
          </p>
          <button
            onClick={setupVault}
            disabled={loading}
            style={{
              padding: "12px 28px",
              background: loading ? "#CCC" : "#1A1814",
              color: "#F6F3EE",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: 14,
            }}
          >
            {loading ? "Setting up…" : "Set up vault keys"}
          </button>
        </section>
      )}

      {configured && (
        <>
          <section style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 15, color: "#1A1814", marginBottom: 12 }}>Documents</h3>
            {share2Ready && (
              <p style={{ fontSize: 12, color: "#B8902A", marginBottom: 12 }}>
                Recovery share active in this session.
                {takeShare2ForKit() ? ` (${share2ToBase64url(takeShare2ForKit()!).slice(0, 12)}…)` : ""}
              </p>
            )}
            <label
              style={{
                display: "inline-block",
                padding: "10px 20px",
                background: "#B8902A",
                color: "#1A1814",
                fontSize: 13,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              Upload encrypted file
              <input
                type="file"
                hidden
                disabled={loading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadDocument(file);
                }}
              />
            </label>
            {documents.length === 0 ? (
              <p style={{ fontSize: 13, color: "#999", marginTop: 16 }}>No documents yet.</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, marginTop: 16 }}>
                {documents.map((doc) => (
                  <li
                    key={doc.id}
                    style={{
                      padding: "10px 0",
                      borderBottom: "1px solid #DDD9D0",
                      fontSize: 13,
                      color: "#555",
                    }}
                  >
                    {doc.file_name} · {doc.doc_type} ·{" "}
                    {doc.file_size_bytes ? `${doc.file_size_bytes} bytes` : "—"}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 15, color: "#1A1814", marginBottom: 12 }}>Nominees</h3>
            <form
              onSubmit={inviteNominee}
              style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}
            >
              <input
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Full name"
                required
                style={inputStyle}
              />
              <input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Email"
                type="email"
                required
                style={inputStyle}
              />
              <button type="submit" disabled={loading} style={buttonStyle}>
                Invite
              </button>
            </form>
            {nominees.length === 0 ? (
              <p style={{ fontSize: 13, color: "#999" }}>No nominees invited yet.</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0 }}>
                {nominees.map((n) => (
                  <li
                    key={n.id}
                    style={{
                      padding: "10px 0",
                      borderBottom: "1px solid #DDD9D0",
                      fontSize: 13,
                      color: "#555",
                    }}
                  >
                    {n.full_name} · {n.email} · {n.kyc_status}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 style={{ fontSize: 15, color: "#1A1814", marginBottom: 12 }}>
              Emergency release
            </h3>
            {releaseEvents.length === 0 ? (
              <p style={{ fontSize: 13, color: "#999" }}>
                No release events. Nominees request via their invite link after KYC.
              </p>
            ) : (
              releaseEvents.map((event) => (
                <div
                  key={event.id}
                  style={{
                    padding: 16,
                    border: "1px solid #DDD9D0",
                    marginBottom: 12,
                    fontSize: 13,
                  }}
                >
                  <p style={{ margin: "0 0 8px", color: "#1A1814" }}>
                    Status: <strong>{event.status}</strong>
                    {event.time_lock_expires_at &&
                      ` · time lock until ${new Date(event.time_lock_expires_at).toLocaleDateString()}`}
                  </p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {event.status === "requested" && (
                      <button
                        onClick={() => advanceRelease(event.id, "death_cert_submitted")}
                        style={buttonStyle}
                      >
                        Mark death cert submitted
                      </button>
                    )}
                    {event.status === "death_cert_submitted" && (
                      <button
                        onClick={() => advanceRelease(event.id, "ops_review")}
                        style={buttonStyle}
                      >
                        Start ops review
                      </button>
                    )}
                    {event.status === "ops_review" && (
                      <button
                        onClick={() => advanceRelease(event.id, "time_lock")}
                        style={buttonStyle}
                      >
                        Begin 7-day time lock
                      </button>
                    )}
                    {event.status === "time_lock" && (
                      <button
                        onClick={() => advanceRelease(event.id, "approved")}
                        style={buttonStyle}
                      >
                        Approve release
                      </button>
                    )}
                    {event.status === "approved" && (
                      <button
                        onClick={() => advanceRelease(event.id, "completed")}
                        style={buttonStyle}
                      >
                        Mark completed
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </section>
        </>
      )}
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "8px 10px",
  border: "1px solid #DDD9D0",
  background: "#FAF8F4",
  fontSize: 13,
  flex: "1 1 160px",
};

const buttonStyle: React.CSSProperties = {
  padding: "8px 16px",
  background: "#1A1814",
  color: "#F6F3EE",
  border: "none",
  cursor: "pointer",
  fontSize: 13,
};