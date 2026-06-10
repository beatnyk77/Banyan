"use client";
import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const QUESTIONS = [
  "What is your name?",
  "Do you have any bank accounts? Which banks are they with?",
  "Do you hold any mutual funds or fixed deposits?",
  "Do you have any life insurance policies? Which insurer?",
  "Do you own property — a flat, land, or commercial space?",
  "Do you have an EPF account from a current or previous employer?",
  "Do you have a demat account for shares or bonds?",
  "Do you have a bank locker?",
  "Do you hold any cryptocurrency or digital assets?",
  "Who is your primary beneficiary — the person you want to inherit the most?",
];

export function IntakeDemo({ onComplete }: { onComplete: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: QUESTIONS[0] },
  ]);
  const [input, setInput] = useState("");
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    if (!input.trim() || done) return;
    const next = step + 1;
    const updated: Message[] = [
      ...messages,
      { role: "user", content: input.trim() },
    ];
    if (next < QUESTIONS.length) {
      updated.push({ role: "assistant", content: QUESTIONS[next] });
      setStep(next);
    } else {
      updated.push({
        role: "assistant",
        content:
          "Thank you. I've sketched your asset registry — you have quite a few things worth protecting. Pre-order Banyan to complete the registry, generate your will-ready document, and get a printed execution kit.",
      });
      setDone(true);
      onComplete();
    }
    setMessages(updated);
    setInput("");
  };

  const progress = Math.round(((step + (done ? 1 : 0)) / QUESTIONS.length) * 100);

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      {/* Progress bar */}
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
      <p style={{ fontSize: 12, color: "#999", marginBottom: 12, textAlign: "right" }}>
        {step + (done ? 1 : 0)} / {QUESTIONS.length} questions
      </p>

      {/* Chat area */}
      <div
        style={{
          background: "#0D1020",
          padding: "20px 24px",
          borderRadius: 4,
          minHeight: 320,
          maxHeight: 420,
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
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {!done && (
        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
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
            autoFocus
          />
          <button
            onClick={send}
            style={{
              padding: "10px 20px",
              background: "#1A1814",
              color: "#F6F3EE",
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              letterSpacing: "0.04em",
            }}
          >
            Send
          </button>
        </div>
      )}
    </div>
  );
}
