import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Signal — Prediction Market Intelligence",
  description:
    "Model any event. Find your edge. Signal aggregates prediction markets and lets you build probability models to spot opportunities.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <header className="border-b border-sand">
          <nav className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
            <Link href="/" className="font-serif text-xl tracking-tight">
              Signal
            </Link>
            <div className="flex gap-6 text-sm text-warm-600">
              <Link href="/markets" className="hover:text-ink transition-colors">
                Markets
              </Link>
            </div>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
