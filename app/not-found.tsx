import Link from "next/link";

export default function NotFound() {
  return (
    <main
      style={{
        background: "#F6F3EE",
        minHeight: "100vh",
        padding: "60px 40px",
        fontFamily: "Barlow, sans-serif",
        textAlign: "center",
      }}
    >
      <h1
        style={{
          fontFamily: "Cormorant Garamond, Georgia, serif",
          fontSize: 48,
          color: "#1A1814",
          fontWeight: 400,
          margin: 0,
        }}
      >
        404
      </h1>
      <p style={{ color: "#555", marginTop: 12 }}>This page could not be found.</p>
      <Link
        href="/"
        style={{
          display: "inline-block",
          marginTop: 24,
          fontSize: 14,
          color: "#1A1814",
        }}
      >
        ← Back to Banyan
      </Link>
    </main>
  );
}