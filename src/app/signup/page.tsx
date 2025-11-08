"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useSession } from "@/components/session-provider";

export default function SignupPage() {
  const router = useRouter();
  const { user, setUser } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      router.replace("/");
    }
  }, [user, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (status === "loading") return;

    if (password !== confirmation) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setStatus("loading");
    setError(null);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message ?? "Impossible de créer le compte.");
      }

      const newUser = await response.json();
      setUser(newUser);
      router.replace("/");
      router.refresh();
    } catch (signupError) {
      setError(signupError instanceof Error ? signupError.message : "Erreur inconnue.");
      setStatus("idle");
    }
  };

  return (
    <section className="form-card">
      <h1>Inscription</h1>
      <p>Créez votre compte pour commenter et aimer les rapports publiés.</p>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="name">Nom complet</label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
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
            autoComplete="new-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
          />
        </div>
        <div className="field">
          <label htmlFor="confirmation">Confirmation du mot de passe</label>
          <input
            id="confirmation"
            name="confirmation"
            type="password"
            autoComplete="new-password"
            required
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            minLength={8}
          />
        </div>
        {error && <p className="feedback error">{error}</p>}
        <button className="submit-button" type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Création en cours..." : "Créer mon compte"}
        </button>
      </form>
      <p>
        Vous avez déjà un compte ? <Link href="/login">Se connecter</Link>
      </p>
    </section>
  );
}
