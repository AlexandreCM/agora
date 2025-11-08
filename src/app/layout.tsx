import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

import { LogoutButton } from "@/components/logout-button";
import { SessionProvider } from "@/components/session-provider";
import { getCurrentUser } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agora",
  description: "Prototype feed for Agora reports",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html lang="fr">
      <body>
        <SessionProvider user={user}>
          <header className="site-header">
            <div className="container header-content">
              <Link href="/" className="brand">
                Agora
              </Link>
              <nav className="nav-links">
                <Link href="/">Fil d'actualité</Link>
                {user?.role === "admin" && <Link href="/admin">Admin</Link>}
              </nav>
              <div className="auth-links">
                {user ? (
                  <>
                    <span className="welcome">Bonjour, {user.name}</span>
                    <LogoutButton />
                  </>
                ) : (
                  <>
                    <Link href="/login">Connexion</Link>
                    <Link className="primary-link" href="/signup">
                      Inscription
                    </Link>
                  </>
                )}
              </div>
            </div>
          </header>
          <main className="container main-content">{children}</main>
          <footer className="site-footer">
            <div className="container">Prototype MVP · Agora</div>
          </footer>
        </SessionProvider>
      </body>
    </html>
  );
}
