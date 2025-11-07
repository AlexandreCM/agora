import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Agora",
  description: "Prototype feed for Agora reports",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="container header-content">
            <Link href="/" className="brand">
              Agora
            </Link>
            <nav className="nav-links">
              <Link href="/">Fil d'actualité</Link>
              <Link href="/admin">Admin</Link>
            </nav>
          </div>
        </header>
        <main className="container main-content">{children}</main>
        <footer className="site-footer">
          <div className="container">Prototype MVP · Agora</div>
        </footer>
      </body>
    </html>
  );
}
