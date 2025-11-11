"use client";

import Link from "next/link";

import { LogoutButton } from "@/components/logout-button";
import { useSession } from "@/components/session-provider";

export function AppHeader() {
  const { user } = useSession();

  return (
    <header className="site-header">
      <div className="container header-content">
        <Link href="/" className="brand">
          Agora
        </Link>
        <nav className="nav-links">
          <Link href="/">Fil d'actualité</Link>
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
  );
}
