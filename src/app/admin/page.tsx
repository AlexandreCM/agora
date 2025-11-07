"use client";

import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

const INITIAL_STATE = {
  title: "",
  summary: "",
  sourceUrl: "",
  tags: "",
  adminToken: "",
};

type FormState = typeof INITIAL_STATE;

export default function AdminPage() {
  const [formState, setFormState] = useState<FormState>(INITIAL_STATE);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string>("");

  const handleChange = (field: keyof FormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormState((previous) => ({
        ...previous,
        [field]: event.target.value,
      }));
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": formState.adminToken,
        },
        body: JSON.stringify({
          title: formState.title,
          summary: formState.summary,
          sourceUrl: formState.sourceUrl,
          tags: formState.tags,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody?.message ?? "Impossible de créer le post.");
      }

      setStatus("success");
      setMessage("Post créé avec succès !");
      setFormState((previous) => ({
        ...INITIAL_STATE,
        adminToken: previous.adminToken,
      }));
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Erreur inconnue");
    }
  };

  return (
    <section>
      <form className="form-card" onSubmit={handleSubmit}>
        <h1>Publier un rapport</h1>
        <p>
          Renseignez les champs ci-dessous pour ajouter un nouveau rapport dans
          le fil d'actualité. Le jeton admin est requis pour valider
          l'opération.
        </p>
        <div className="field">
          <label htmlFor="title">Titre</label>
          <input
            id="title"
            name="title"
            placeholder="Ex : Rapport annuel sur la transition énergétique"
            value={formState.title}
            onChange={handleChange("title")}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="summary">Résumé</label>
          <textarea
            id="summary"
            name="summary"
            placeholder="Synthèse en quelques phrases..."
            value={formState.summary}
            onChange={handleChange("summary")}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="sourceUrl">Lien vers la source</label>
          <input
            id="sourceUrl"
            name="sourceUrl"
            type="url"
            placeholder="https://..."
            value={formState.sourceUrl}
            onChange={handleChange("sourceUrl")}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="tags">Tags (séparés par des virgules)</label>
          <input
            id="tags"
            name="tags"
            placeholder="France, Politique, Transition énergétique"
            value={formState.tags}
            onChange={handleChange("tags")}
          />
        </div>
        <div className="field">
          <label htmlFor="adminToken">Jeton administrateur</label>
          <input
            id="adminToken"
            name="adminToken"
            value={formState.adminToken}
            onChange={handleChange("adminToken")}
            placeholder="Saisissez le jeton défini côté serveur"
            required
          />
        </div>
        <button className="submit-button" type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Publication..." : "Publier"}
        </button>
        {message && (
          <p className={`feedback ${status === "error" ? "error" : "success"}`}>
            {message}
          </p>
        )}
      </form>
    </section>
  );
}
