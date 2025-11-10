"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { useSession } from "@/components/session-provider";

function normaliseRedirect(target: string | null): string {
  if (!target) {
    return "/";
  }

  const trimmed = target.trim();

  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return "/";
  }

  return trimmed;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, setUser } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState<string | null>(null);

  const redirectTarget = useMemo(
    () => normaliseRedirect(searchParams.get("from")),
    [searchParams],
  );

  useEffect(() => {
    if (user) {
      router.replace(redirectTarget);
    }
  }, [user, router, redirectTarget]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (status === "loading") return;

    setStatus("loading");
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message ?? "Identifiants invalides.");
      }

      const authenticatedUser = await response.json();
      setUser(authenticatedUser);

      router.replace(redirectTarget);
      router.refresh();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Identifiants invalides.");
      setStatus("idle");
    }
  };

  return (
    <section className="form-card">
      <h1>Connexion</h1>
      <p>Connectez-vous pour participer aux discussions et interagir avec les publications.</p>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="password">Mot de passe</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        {error && <p className="feedback error">{error}</p>}
        <button className="submit-button" type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Connexion..." : "Se connecter"}
        </button>
      </form>
      <p>
        Pas encore de compte ? <Link href="/signup">Créer un compte</Link>
      </p>
    </section>
  );
}
