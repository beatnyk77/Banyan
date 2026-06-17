"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { EstateJson } from "@/skills/intake-skill/estate-schema";
import { createEmptyEstate } from "@/skills/intake-skill/empty-estate";
import { progressPct, type IntakeStateId } from "@/skills/intake-skill/state-machine";
import { OPENING_MESSAGES } from "@/skills/intake-skill/prompts";
import { encryptEstate, decryptEstate } from "@/lib/intake/client-crypto";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface IntakeChatProps {
  passphrase: string;
}

export function IntakeChat({ passphrase }: IntakeChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentState, setCurrentState] = useState<IntakeStateId>("welcome");
  const [estate, setEstate] = useState<EstateJson>(createEmptyEstate());
  const [estateId, setEstateId] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const res = await fetch("/api/intake");
        if (!res.ok) throw new Error("Failed to load intake session");
        const data = await res.json();
        setEstateId(data.estateId);
        const state = data.currentState as IntakeStateId;
        setCurrentState(state);

        if (data.encryptedEstate) {
          const decrypted = await decryptEstate(data.encryptedEstate, passphrase);
          setEstate(decrypted);
        }

        setMessages([{ role: "assistant", content: OPENING_MESSAGES[state] }]);
        setReady(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to initialise");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [passphrase]);

  const persist = async (
    nextState: IntakeStateId,
    updatedEstate: EstateJson
  ) => {
    if (!estateId) return;
    const { ciphertext, envelopeMeta } = await encryptEstate(updatedEstate, passphrase);
    const res = await fetch("/api/intake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "persist",
        estateId,
        currentState: nextState,
        estateJsonEnc: ciphertext,
        envelopeMeta,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error ?? "Failed to save");
    }
  };

  const send = async () => {
    if (!input.trim() || loading || completed || !ready) return;
    const userMsg = input.trim();
    setInput("");
    setLoading(true);
    setError("");

    const updatedMessages: Message[] = [
      ...messages,
      { role: "user", content: userMsg },
    ];
    setMessages(updatedMessages);

    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "turn",
          message: userMsg,
          currentState,
          estate,
          recentMessages: updatedMessages.slice(-8).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Turn failed");

      setEstate(data.estate);
      setCurrentState(data.nextState);
      setCompleted(data.completed);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.assistantMessage },
      ]);

      await persist(data.nextState, data.estate);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const progress = progressPct(currentState);

  if (!ready && loading) {
    return (
      <p style={{ fontSize: 14, color: "#777", textAlign: "center", marginTop: 40 }}>
        Loading your registry…
      </p>
    );
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <div
        style={{
          height: 3,
          background: "#DDD9D0",
          marginBottom: 16,
          borderRadius: 2,
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            background: "#B8902A",
            transition: "width 0.3s ease",
            borderRadius: 2,
          }}
        />
      </div>
      <p
        style={{
          fontSize: 12,
          color: "#999",
          marginBottom: 12,
          textAlign: "right",
        }}
      >
        {progress}% complete · {currentState.replace(/_/g, " ")}
      </p>

      <div
        style={{
          background: "#0D1020",
          padding: "20px 24px",
          borderRadius: 4,
          minHeight: 360,
          maxHeight: 480,
          overflowY: "auto",
        }}
      >
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: 14 }}>
            <span
              style={{
                fontSize: 10,
                letterSpacing: "0.08em",
                color: m.role === "assistant" ? "#B8902A" : "#888",
                textTransform: "uppercase",
                display: "block",
                marginBottom: 4,
              }}
            >
              {m.role === "assistant" ? "Banyan" : "You"}
            </span>
            <span
              style={{
                fontSize: 14,
                lineHeight: 1.6,
                color: m.role === "assistant" ? "#F6F3EE" : "#C8C4BC",
              }}
            >
              {m.content}
            </span>
          </div>
        ))}
        {loading && (
          <span style={{ fontSize: 13, color: "#888", fontStyle: "italic" }}>
            Banyan is thinking…
          </span>
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p style={{ fontSize: 13, color: "#C44", marginTop: 8 }}>{error}</p>
      )}

      {!completed && (
        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            disabled={loading}
            style={{
              flex: 1,
              padding: "10px 14px",
              border: "1px solid #B8902A",
              background: "#F6F3EE",
              fontSize: 14,
              outline: "none",
              color: "#1A1814",
            }}
            placeholder="Type your answer and press Enter…"
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            style={{
              padding: "10px 20px",
              background: loading || !input.trim() ? "#CCC" : "#1A1814",
              color: "#F6F3EE",
              border: "none",
              cursor: loading || !input.trim() ? "not-allowed" : "pointer",
              fontSize: 13,
              letterSpacing: "0.04em",
            }}
          >
            Send
          </button>
        </div>
      )}

      {completed && (
        <div
          style={{
            marginTop: 24,
            padding: 20,
            border: "1px solid #B8902A",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 15, color: "#1A1814", marginBottom: 12 }}>
            Your asset registry is complete and encrypted.
          </p>
          <p style={{ fontSize: 13, color: "#777", marginBottom: 16 }}>
            {estate.assets.length} assets recorded. Generate your will draft next.
          </p>
          <Link
            href="/will"
            style={{
              display: "inline-block",
              padding: "12px 24px",
              background: "#1A1814",
              color: "#F6F3EE",
              textDecoration: "none",
              fontSize: 13,
              letterSpacing: "0.04em",
            }}
          >
            Generate will draft →
          </Link>
        </div>
      )}
    </div>
  );
}