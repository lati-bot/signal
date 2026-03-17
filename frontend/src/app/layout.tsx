import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Signal",
  description: "Event intelligence for prediction markets",
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
          <nav className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <a href="/" className="font-serif text-xl tracking-tight">
              Signal
            </a>
            <div className="flex gap-6 text-sm text-warm-600">
              <a href="/markets" className="hover:text-ink transition-colors">
                Markets
              </a>
            </div>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
