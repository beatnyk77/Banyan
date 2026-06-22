"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
          fontSize: 32,
          color: "#1A1814",
          fontWeight: 400,
        }}
      >
        Something went wrong
      </h1>
      <p style={{ color: "#555", marginTop: 12, maxWidth: 420, margin: "12px auto 0" }}>
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      <button
        type="button"
        onClick={reset}
        style={{
          marginTop: 24,
          padding: "12px 28px",
          background: "#1A1814",
          color: "#F6F3EE",
          border: "none",
          cursor: "pointer",
          fontSize: 14,
        }}
      >
        Try again
      </button>
    </main>
  );
}