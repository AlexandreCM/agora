"use client";

import { useState, type KeyboardEvent, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import type { Post } from "@/types/post";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const router = useRouter();
  const [likes, setLikes] = useState(post.likes);
  const [isLiking, setIsLiking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleNavigate() {
    router.push(`/posts/${post.id}`);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleNavigate();
    }
  }

  async function handleLike(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();

    if (isLiking) return;

    setIsLiking(true);
    setError(null);

    try {
      const response = await fetch(`/api/posts/${post.id}/like`, { method: "POST" });

      if (!response.ok) {
        throw new Error("Impossible d'enregistrer votre appréciation.");
      }

      const updatedPost = (await response.json()) as Post;
      setLikes(updatedPost.likes);
    } catch (likeError) {
      setError(likeError instanceof Error ? likeError.message : "Une erreur est survenue.");
    } finally {
      setIsLiking(false);
    }
  }

  function handleSourceClick(event: MouseEvent<HTMLAnchorElement>) {
    event.stopPropagation();
  }

  return (
    <article
      className="post-card post-card--clickable"
      onClick={handleNavigate}
      onKeyDown={handleKeyDown}
      role="link"
      tabIndex={0}
      aria-label={`Consulter les détails de ${post.title}`}
    >
      <div className="post-header">
        <h2 className="post-title">{post.title}</h2>
        <div className="post-meta">
          <time dateTime={post.createdAt}>
            Publié le {format(new Date(post.createdAt), "d MMMM yyyy", { locale: fr })}
          </time>
          <span>par Agora</span>
        </div>
      </div>
      <p>{post.summary}</p>
      {post.tags.length > 0 && (
        <ul className="tag-list">
          {post.tags.map((tag) => (
            <li className="tag" key={tag}>
              {tag}
            </li>
          ))}
        </ul>
      )}
      {error && <p className="feedback error">{error}</p>}
      <div className="post-actions">
        <a
          className="source-link"
          href={post.sourceUrl}
          target="_blank"
          rel="noreferrer"
          onClick={handleSourceClick}
        >
          Consulter la source ↗
        </a>
        <button
          className="interaction-button"
          type="button"
          onClick={handleLike}
          disabled={isLiking}
          aria-label="J'aime ce rapport"
        >
          ❤️ {likes}
        </button>
      </div>
    </article>
  );
}
