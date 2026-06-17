"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/intake";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push(next);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        placeholder="Email"
        style={inputStyle}
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        placeholder="Password"
        style={inputStyle}
      />
      {error && <p style={{ fontSize: 13, color: "#C44", margin: 0 }}>{error}</p>}
      <button type="submit" disabled={loading} style={buttonStyle}>
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main
      style={{
        background: "#F6F3EE",
        minHeight: "100vh",
        padding: "60px 40px",
        fontFamily: "Barlow, sans-serif",
      }}
    >
      <div style={{ maxWidth: 400, margin: "0 auto" }}>
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
            marginBottom: 8,
          }}
        >
          Sign in
        </h1>
        <p style={{ fontSize: 13, color: "#777", marginBottom: 24 }}>
          Access your encrypted asset registry.
        </p>

        <Suspense fallback={<p style={{ fontSize: 13, color: "#777" }}>Loading…</p>}>
          <LoginForm />
        </Suspense>

        <p style={{ fontSize: 13, color: "#777", marginTop: 20 }}>
          No account?{" "}
          <Link href="/signup" style={{ color: "#1A1814" }}>
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  border: "1px solid #DDD9D0",
  background: "#FAF8F4",
  fontSize: 14,
  color: "#1A1814",
  outline: "none",
};

const buttonStyle: React.CSSProperties = {
  padding: "12px 24px",
  background: "#1A1814",
  color: "#F6F3EE",
  border: "none",
  cursor: "pointer",
  fontSize: 14,
  marginTop: 8,
};