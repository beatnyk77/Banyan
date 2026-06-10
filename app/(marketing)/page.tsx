import Link from "next/link";

export default function LandingPage() {
  return (
    <main
      style={{
        background: "#F6F3EE",
        minHeight: "100vh",
        padding: "60px 40px",
        fontFamily: "Barlow, sans-serif",
      }}
    >
      <header
        style={{
          borderBottom: "1px solid #B8902A",
          paddingBottom: 24,
          marginBottom: 40,
        }}
      >
        <h1
          style={{
            fontFamily: "Cormorant Garamond, Georgia, serif",
            fontSize: 40,
            color: "#1A1814",
            margin: 0,
            fontWeight: 400,
          }}
        >
          Banyan
        </h1>
        <p style={{ color: "#777", marginTop: 6, fontSize: 13, letterSpacing: "0.04em" }}>
          by Founder's Office & Co
        </p>
      </header>

      <section style={{ maxWidth: 620 }}>
        <h2
          style={{
            fontFamily: "Cormorant Garamond, Georgia, serif",
            fontSize: 30,
            color: "#1A1814",
            fontWeight: 400,
            lineHeight: 1.3,
          }}
        >
          Everything you own, in one place.
          <br />
          Ready when it matters most.
        </h2>

        <p
          style={{
            fontSize: 15,
            lineHeight: 1.8,
            color: "#1A1814",
            marginTop: 20,
          }}
        >
          Banyan guides you through a 20-minute conversation to build a complete
          registry of what you own — bank accounts, property, investments,
          insurance, lockers — and generates a will-ready document with an
          offline execution kit.
        </p>

        <p
          style={{
            fontSize: 13,
            color: "#777",
            marginTop: 14,
            fontStyle: "italic",
            lineHeight: 1.6,
          }}
        >
          Banyan generates will-ready documents; it does not execute legally valid
          wills digitally. Wet-ink execution is required under the Indian Succession
          Act, 1925.
        </p>

        <div
          style={{ marginTop: 36, display: "flex", gap: 16, flexWrap: "wrap" }}
        >
          <Link
            href="/demo"
            style={{
              background: "#1A1814",
              color: "#F6F3EE",
              padding: "12px 28px",
              textDecoration: "none",
              fontSize: 13,
              letterSpacing: "0.06em",
              display: "inline-block",
            }}
          >
            Try the demo (free)
          </Link>
          <Link
            href="/pre-order"
            style={{
              border: "1px solid #B8902A",
              color: "#1A1814",
              padding: "12px 28px",
              textDecoration: "none",
              fontSize: 13,
              letterSpacing: "0.06em",
              display: "inline-block",
            }}
          >
            Pre-order — ₹1,999
          </Link>
        </div>
      </section>

      <section style={{ marginTop: 80, maxWidth: 620 }}>
        <h3
          style={{
            fontFamily: "Cormorant Garamond, Georgia, serif",
            fontSize: 22,
            color: "#1A1814",
            fontWeight: 400,
            marginBottom: 20,
          }}
        >
          What Banyan covers
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: 12,
          }}
        >
          {[
            "Bank accounts",
            "Mutual funds & FDs",
            "Life insurance",
            "Property & land",
            "EPF & PPF",
            "Demat accounts",
            "Bank lockers",
            "Crypto assets",
            "Vehicles",
            "Digital accounts",
            "Domain names",
            "Loans & liabilities",
          ].map((item) => (
            <div
              key={item}
              style={{
                padding: "10px 14px",
                border: "1px solid #DDD9D0",
                fontSize: 13,
                color: "#1A1814",
                background: "#FAF8F4",
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </section>

      <footer
        style={{
          marginTop: 80,
          borderTop: "1px solid #DDD9D0",
          paddingTop: 20,
          fontSize: 12,
          color: "#999",
        }}
      >
        FoundersHQ LLP · GST-registered · India
      </footer>
    </main>
  );
}
