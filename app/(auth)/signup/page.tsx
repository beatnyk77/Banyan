"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/intake");
    router.refresh();
  };

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
          Create account
        </h1>
        <p style={{ fontSize: 13, color: "#777", marginBottom: 24 }}>
          Start building your family asset registry.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            placeholder="Full name"
            style={inputStyle}
          />
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
            minLength={8}
            placeholder="Password (min 8 characters)"
            style={inputStyle}
          />
          <p style={{ fontSize: 11, color: "#999", lineHeight: 1.5, margin: 0 }}>
            By creating an account, you consent to Banyan (FoundersHQ LLP) processing your
            personal data for succession document generation under the DPDP Act, 2023.
          </p>
          {error && <p style={{ fontSize: 13, color: "#C44", margin: 0 }}>{error}</p>}
          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>

        <p style={{ fontSize: 13, color: "#777", marginTop: 20 }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "#1A1814" }}>
            Sign in
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