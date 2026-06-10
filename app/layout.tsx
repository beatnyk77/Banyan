import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Banyan — Family Asset Continuity",
  description:
    "An AI-guided registry of everything you own, with a will-ready document and encrypted vault.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
