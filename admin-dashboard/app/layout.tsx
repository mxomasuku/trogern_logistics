import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trogern Admin Dashboard",
  description: "Admin dashboard for Trogern Logistics SaaS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-50">{children}</body>
    </html>
  );
}
