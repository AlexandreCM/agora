"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

import type { RssFeed } from "@/types/rss-feed";

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
  const [feeds, setFeeds] = useState<RssFeed[]>([]);
  const [feedStatus, setFeedStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [feedMessage, setFeedMessage] = useState<string>("");
  const [editingFeedId, setEditingFeedId] = useState<string | null>(null);
  const [feedForm, setFeedForm] = useState({
    label: "",
    url: "",
    tags: "",
    active: true,
  });

  const isEditingFeed = useMemo(() => Boolean(editingFeedId), [editingFeedId]);

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

  const loadFeeds = async () => {
    try {
      const response = await fetch("/api/rss-feeds");
      if (!response.ok) {
        throw new Error("Impossible de charger les flux RSS.");
      }
      const body = await response.json();
      setFeeds(Array.isArray(body) ? body : []);
    } catch (error) {
      console.error(error);
      setFeeds([]);
    }
  };

  useEffect(() => {
    loadFeeds();
  }, []);

  const handleFeedFieldChange = (field: keyof typeof feedForm) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      if (field === "active") {
        setFeedForm((previous) => ({
          ...previous,
          active: event.target.checked,
        }));
        return;
      }

      setFeedForm((previous) => ({
        ...previous,
        [field]: event.target.value,
      }));
    };

  const resetFeedForm = () => {
    setFeedForm({
      label: "",
      url: "",
      tags: "",
      active: true,
    });
    setEditingFeedId(null);
  };

  const ensureAdminToken = () => {
    if (!formState.adminToken) {
      setFeedStatus("error");
      setFeedMessage("Veuillez renseigner le jeton administrateur pour gérer les flux RSS.");
      return false;
    }
    return true;
  };

  const handleFeedSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!ensureAdminToken()) {
      return;
    }

    setFeedStatus("loading");
    setFeedMessage("");

    const payload = {
      label: feedForm.label,
      url: feedForm.url,
      tags: feedForm.tags,
      active: feedForm.active,
    };

    const endpoint = isEditingFeed ? `/api/rss-feeds/${editingFeedId}` : "/api/rss-feeds";
    const method = isEditingFeed ? "PATCH" : "POST";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": formState.adminToken,
        },
        body: JSON.stringify(payload),
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(body?.message ?? "Impossible d'enregistrer le flux RSS.");
      }

      const baseMessage = isEditingFeed ? "Flux mis à jour avec succès." : "Flux ajouté avec succès.";

      if (body?.importResult) {
        const { createdPosts = 0, processedItems = 0, errors = [] } = body.importResult;
        const importMessage = `${createdPosts} post(s) créé(s) sur ${processedItems} élément(s).${
          errors.length ? ` ${errors.length} erreur(s).` : ""
        }`;
        setFeedMessage(`${baseMessage} ${importMessage}`);
      } else {
        setFeedMessage(baseMessage);
      }

      setFeedStatus("success");
      resetFeedForm();
      await loadFeeds();
    } catch (error) {
      setFeedStatus("error");
      setFeedMessage(error instanceof Error ? error.message : "Erreur inconnue");
    }
  };

  const handleFeedEdit = (feed: RssFeed) => () => {
    setEditingFeedId(feed.id);
    setFeedForm({
      label: feed.label,
      url: feed.url,
      tags: feed.tags.join(", "),
      active: feed.active,
    });
    setFeedStatus("idle");
    setFeedMessage("");
  };

  const handleFeedToggle = (feed: RssFeed) => async () => {
    if (!ensureAdminToken()) {
      return;
    }

    setFeedStatus("loading");
    setFeedMessage("");

    try {
      const response = await fetch(`/api/rss-feeds/${feed.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": formState.adminToken,
        },
        body: JSON.stringify({ active: !feed.active }),
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(body?.message ?? "Impossible de mettre à jour le flux.");
      }

      if (body?.importResult) {
        const { createdPosts = 0, processedItems = 0, errors = [] } = body.importResult;
        const importMessage = `${createdPosts} post(s) créé(s) sur ${processedItems} élément(s).${
          errors.length ? ` ${errors.length} erreur(s).` : ""
        }`;
        setFeedMessage(importMessage);
      } else {
        setFeedMessage("Statut du flux mis à jour.");
      }
      setFeedStatus("success");
      await loadFeeds();
    } catch (error) {
      setFeedStatus("error");
      setFeedMessage(error instanceof Error ? error.message : "Erreur inconnue");
    }
  };

  const handleFeedDelete = (feed: RssFeed) => async () => {
    if (!ensureAdminToken()) {
      return;
    }

    setFeedStatus("loading");
    setFeedMessage("");

    try {
      const response = await fetch(`/api/rss-feeds/${feed.id}`, {
        method: "DELETE",
        headers: {
          "x-admin-token": formState.adminToken,
        },
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(body?.message ?? "Impossible de supprimer le flux.");
      }

      setFeedStatus("success");
      setFeedMessage("Flux supprimé avec succès.");

      if (editingFeedId === feed.id) {
        resetFeedForm();
      }

      await loadFeeds();
    } catch (error) {
      setFeedStatus("error");
      setFeedMessage(error instanceof Error ? error.message : "Erreur inconnue");
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
      <form className="form-card" onSubmit={handleFeedSubmit}>
        <h2>Gérer les flux RSS</h2>
        <p>
          Ajoutez des flux RSS pour automatiser la création de rapports. Chaque flux peut
          être activé ou désactivé et possède ses propres tags.
        </p>
        <div className="field">
          <label htmlFor="feed-label">Nom du flux</label>
          <input
            id="feed-label"
            name="feed-label"
            placeholder="Ex : Actualités énergie"
            value={feedForm.label}
            onChange={handleFeedFieldChange("label")}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="feed-url">URL du flux RSS</label>
          <input
            id="feed-url"
            name="feed-url"
            type="url"
            placeholder="https://exemple.com/rss"
            value={feedForm.url}
            onChange={handleFeedFieldChange("url")}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="feed-tags">Tags (séparés par des virgules)</label>
          <input
            id="feed-tags"
            name="feed-tags"
            placeholder="Energie, France"
            value={feedForm.tags}
            onChange={handleFeedFieldChange("tags")}
          />
        </div>
        <div className="field checkbox-field">
          <label htmlFor="feed-active">Activer automatiquement le flux</label>
          <input
            id="feed-active"
            name="feed-active"
            type="checkbox"
            checked={feedForm.active}
            onChange={handleFeedFieldChange("active")}
          />
        </div>
        <div className="actions-row">
          <button
            className="submit-button"
            type="submit"
            disabled={feedStatus === "loading"}
          >
            {feedStatus === "loading"
              ? "Enregistrement..."
              : isEditingFeed ? "Mettre à jour" : "Ajouter"}
          </button>
          {isEditingFeed && (
            <button type="button" className="secondary-button" onClick={resetFeedForm}>
              Annuler
            </button>
          )}
        </div>
        {feedMessage && (
          <p className={`feedback ${feedStatus === "error" ? "error" : "success"}`}>
            {feedMessage}
          </p>
        )}
      </form>
      <div className="rss-feed-list">
        <h3>Flux enregistrés</h3>
        {feeds.length === 0 ? (
          <p className="empty-rss">Aucun flux n'a encore été configuré.</p>
        ) : (
          <ul>
            {feeds.map((feed) => (
              <li key={feed.id} className="rss-feed-item">
                <div className="rss-feed-meta">
                  <div>
                    <p className="rss-feed-title">{feed.label}</p>
                    <a className="rss-feed-url" href={feed.url} target="_blank" rel="noreferrer">
                      {feed.url}
                    </a>
                    <p className="rss-feed-tags">Tags : {feed.tags.join(", ") || "Aucun"}</p>
                    <p className="rss-feed-status">
                      Statut : <span className={feed.active ? "badge active" : "badge inactive"}>{feed.active ? "Actif" : "Inactif"}</span>
                    </p>
                    {feed.lastFetchedAt && (
                      <p className="rss-feed-last">Dernière importation : {new Date(feed.lastFetchedAt).toLocaleString()}</p>
                    )}
                  </div>
                </div>
                <div className="rss-feed-actions">
                  <button type="button" onClick={handleFeedEdit(feed)}>
                    Modifier
                  </button>
                  <button type="button" onClick={handleFeedToggle(feed)}>
                    {feed.active ? "Désactiver" : "Activer"}
                  </button>
                  <button type="button" className="danger" onClick={handleFeedDelete(feed)}>
                    Supprimer
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
