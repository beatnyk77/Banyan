import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "#F6F3EE",
        minHeight: "100vh",
        fontFamily: "Barlow, sans-serif",
      }}
    >
      <nav
        style={{
          borderBottom: "1px solid #DDD9D0",
          padding: "16px 40px",
          display: "flex",
          alignItems: "center",
          gap: 24,
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: "Cormorant Garamond, Georgia, serif",
            fontSize: 20,
            color: "#1A1814",
            textDecoration: "none",
          }}
        >
          Banyan
        </Link>
        <Link href="/intake" style={navLinkStyle}>
          Registry
        </Link>
        <Link href="/will" style={navLinkStyle}>
          Will
        </Link>
        <Link href="/vault" style={navLinkStyle}>
          Vault
        </Link>
      </nav>
      {children}
    </div>
  );
}

const navLinkStyle: React.CSSProperties = {
  fontSize: 13,
  color: "#555",
  textDecoration: "none",
  letterSpacing: "0.04em",
};