"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { COMMENT_SECTIONS, type Comment, type CommentSection, type Post } from "@/types/post";
import { useSession } from "@/components/session-provider";

const SECTION_LABELS: Record<CommentSection, string> = {
  analysis: "Analyse",
  debate: "Débat",
  question: "Question",
  proposal: "Proposition",
  avis: "Avis",
};

type CommentGroups = Record<CommentSection, Comment[]>;

function groupComments(comments: Comment[]): CommentGroups {
  return comments.reduce<CommentGroups>((accumulator, comment) => {
    return {
      ...accumulator,
      [comment.section]: [...accumulator[comment.section], comment],
    };
  }, COMMENT_SECTIONS.reduce<CommentGroups>((initial, section) => {
    return { ...initial, [section]: [] };
  }, {} as CommentGroups));
}

interface PostDetailsProps {
  post: Post;
}

export function PostDetails({ post }: PostDetailsProps) {
  const router = useRouter();
  const { user } = useSession();
  const [likes, setLikes] = useState(post.likes);
  const [isLiking, setIsLiking] = useState(false);
  const [hasLiked, setHasLiked] = useState(Boolean(post.viewerHasLiked));
  const [comments, setComments] = useState<Comment[]>(post.comments);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<CommentSection>("analysis");
  const [activeTab, setActiveTab] = useState<CommentSection>(() => {
    const grouped = groupComments(post.comments);
    const firstWithComments = COMMENT_SECTIONS.find((section) => grouped[section].length > 0);
    return firstWithComments ?? COMMENT_SECTIONS[0];
  });
  const [content, setContent] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [replyContents, setReplyContents] = useState<Record<string, string>>({});
  const [replySubmitting, setReplySubmitting] = useState<Partial<Record<string, boolean>>>({});
  const [replyErrors, setReplyErrors] = useState<Partial<Record<string, string | null>>>({});
  const [expandedReplies, setExpandedReplies] = useState<Partial<Record<string, boolean>>>({});
  const [activeReplyComment, setActiveReplyComment] = useState<string | null>(null);

  const isAuthenticated = Boolean(user);
  const commentsBySection = useMemo(() => groupComments(comments), [comments]);
  const activeComments = commentsBySection[activeTab];

  function toggleReplyForm(commentId: string) {
    if (!user) {
      setError("Connectez-vous pour participer aux discussions.");
      router.push(`/login?from=/posts/${post.id}`);
      return;
    }

    setActiveReplyComment((current) => (current === commentId ? null : commentId));
    setReplyErrors((previous) => ({ ...previous, [commentId]: null }));
  }

  function toggleReplies(commentId: string) {
    setExpandedReplies((previous) => ({ ...previous, [commentId]: !previous[commentId] }));
  }

  async function handleLike() {
    if (!user) {
      setError("Connectez-vous pour aimer les rapports.");
      router.push(`/login?from=/posts/${post.id}`);
      return;
    }

    if (isLiking) return;

    setIsLiking(true);
    setError(null);

    try {
      const response = await fetch(`/api/posts/${post.id}/like`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Impossible d'enregistrer votre appréciation.");
      }

      const updatedPost = (await response.json()) as Post;
      setLikes(updatedPost.likes);
      setHasLiked(Boolean(updatedPost.viewerHasLiked));
    } catch (likeError) {
      setError(likeError instanceof Error ? likeError.message : "Une erreur est survenue.");
    } finally {
      setIsLiking(false);
    }
  }

  async function handleSubmitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      setError("Connectez-vous pour participer aux discussions.");
      router.push(`/login?from=/posts/${post.id}`);
      return;
    }

    if (isSubmittingComment) return;

    setIsSubmittingComment(true);
    setFeedback(null);
    setError(null);

    try {
      const response = await fetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          section: selectedSection,
          content,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message ?? "Impossible d'envoyer votre commentaire.");
      }

      const updatedPost = (await response.json()) as Post;
      setComments(updatedPost.comments);
      setContent("");
      setFeedback("Votre contribution a bien été publiée.");
      setActiveTab(selectedSection);
      router.refresh();
    } catch (commentError) {
      setError(commentError instanceof Error ? commentError.message : "Une erreur est survenue.");
    } finally {
      setIsSubmittingComment(false);
    }
  }

  async function handleSubmitReply(commentId: string, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      setError("Connectez-vous pour participer aux discussions.");
      router.push(`/login?from=/posts/${post.id}`);
      return;
    }

    if (replySubmitting[commentId]) {
      return;
    }

    const value = replyContents[commentId]?.trim();

    if (!value) {
      setReplyErrors((previous) => ({ ...previous, [commentId]: "Votre réponse ne peut pas être vide." }));
      return;
    }

    setReplySubmitting((previous) => ({ ...previous, [commentId]: true }));
    setReplyErrors((previous) => ({ ...previous, [commentId]: null }));
    setFeedback(null);
    setError(null);

    try {
      const response = await fetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: value,
          parentId: commentId,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message ?? "Impossible d'envoyer votre réponse.");
      }

      const updatedPost = (await response.json()) as Post;
      setComments(updatedPost.comments);
      setReplyContents((previous) => ({ ...previous, [commentId]: "" }));
      setActiveReplyComment(null);
      setExpandedReplies((previous) => ({ ...previous, [commentId]: true }));
      setFeedback("Merci pour votre réponse !");
      router.refresh();
    } catch (replyError) {
      const message = replyError instanceof Error ? replyError.message : "Une erreur est survenue.";
      setReplyErrors((previous) => ({ ...previous, [commentId]: message }));
    } finally {
      setReplySubmitting((previous) => ({ ...previous, [commentId]: false }));
    }
  }

  return (
    <article className="post-card post-detail" key={post.id}>
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
      <div className="post-actions">
        <a className="source-link" href={post.sourceUrl} target="_blank" rel="noreferrer">
          Consulter la source ↗
        </a>
        <button
          className="interaction-button"
          type="button"
          onClick={handleLike}
          disabled={isLiking}
          aria-pressed={hasLiked}
          aria-label={hasLiked ? "Retirer votre appréciation" : "J'aime ce rapport"}
        >
          ❤️ {likes}
        </button>
      </div>

      <section className="comment-section">
        <h3>Contribuer</h3>
        {isAuthenticated ? (
          <form className="comment-form" onSubmit={handleSubmitComment}>
            <div className="comment-grid">
              <label className="field">
                <span>Type de contribution</span>
                <select
                  value={selectedSection}
                  onChange={(event) => setSelectedSection(event.target.value as CommentSection)}
                >
                  {COMMENT_SECTIONS.map((section) => (
                    <option key={section} value={section}>
                      {SECTION_LABELS[section]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="current-user">Connecté en tant que <strong>{user?.name ?? "Membre"}</strong></p>
            <label className="field">
              <span>Commentaire</span>
              <textarea
                required
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Partagez votre analyse, question, proposition ou avis"
              />
            </label>
            <div className="comment-feedback">
              {feedback && <p className="feedback success">{feedback}</p>}
              {error && <p className="feedback error">{error}</p>}
            </div>
            <button className="submit-button" type="submit" disabled={isSubmittingComment}>
              {isSubmittingComment ? "Publication en cours…" : "Publier"}
            </button>
          </form>
        ) : (
          <div className="comment-feedback">
            <p className="feedback info">
              <Link href={`/login?from=/posts/${post.id}`}>Connectez-vous</Link> pour contribuer aux discussions.
            </p>
            {error && <p className="feedback error">{error}</p>}
          </div>
        )}
      </section>

      <section className="comment-discussions">
        <h3>Discussions</h3>
        <div className="comment-tabs" role="tablist" aria-label="Types de contributions">
          {COMMENT_SECTIONS.map((section) => {
            const sectionComments = commentsBySection[section];
            const isActive = activeTab === section;

            return (
              <button
                key={section}
                type="button"
                className={`comment-tab${isActive ? " comment-tab--active" : ""}`}
                onClick={() => setActiveTab(section)}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${section}`}
                id={`tab-${section}`}
                tabIndex={isActive ? 0 : -1}
              >
                {SECTION_LABELS[section]} <span className="comment-count">({sectionComments.length})</span>
              </button>
            );
          })}
        </div>
        <div
          className="comment-panel"
          role="tabpanel"
          id={`panel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
        >
          {activeComments.length === 0 ? (
            <p className="empty-comments">Aucune contribution pour le moment.</p>
          ) : (
            <ul className="comment-items">
              {activeComments.map((comment) => {
                const isExpanded = Boolean(expandedReplies[comment.id]);
                const visibleReplies = isExpanded ? comment.replies : comment.replies.slice(0, 2);
                const canToggleReplies = comment.replies.length > 2;
                const isReplyFormOpen = activeReplyComment === comment.id;
                const replyValue = replyContents[comment.id] ?? "";
                const replyError = replyErrors[comment.id];
                const isReplySubmitting = Boolean(replySubmitting[comment.id]);

                return (
                  <li key={comment.id} className="comment-item">
                    <div className="comment-meta">
                      <strong>{comment.author}</strong>
                      <time dateTime={comment.createdAt}>
                        {format(new Date(comment.createdAt), "d MMM yyyy 'à' HH'h'mm", { locale: fr })}
                      </time>
                    </div>
                    <p>{comment.content}</p>
                    <div className="comment-actions">
                      <button
                        type="button"
                        className="comment-action-button"
                        onClick={() => toggleReplyForm(comment.id)}
                      >
                        {isReplyFormOpen ? "Annuler" : "Répondre"}
                      </button>
                    </div>
                    {comment.replies.length > 0 && (
                      <div className="comment-replies">
                        <ul className="comment-reply-list">
                          {visibleReplies.map((reply) => (
                            <li key={reply.id} className="comment-reply">
                              <div className="comment-reply-meta">
                                <strong>{reply.author}</strong>
                                <time dateTime={reply.createdAt}>
                                  {format(new Date(reply.createdAt), "d MMM yyyy 'à' HH'h'mm", { locale: fr })}
                                </time>
                              </div>
                              <p>{reply.content}</p>
                            </li>
                          ))}
                        </ul>
                        {canToggleReplies && (
                          <button
                            type="button"
                            className="comment-action-button comment-action-button--secondary"
                            onClick={() => toggleReplies(comment.id)}
                          >
                            {isExpanded ? "Afficher moins" : "Afficher plus"}
                          </button>
                        )}
                      </div>
                    )}
                    {isReplyFormOpen && (
                      <form className="reply-form" onSubmit={(event) => handleSubmitReply(comment.id, event)}>
                        <label className="field">
                          <span>Réponse</span>
                          <textarea
                            required
                            value={replyValue}
                            onChange={(event) =>
                              setReplyContents((previous) => ({
                                ...previous,
                                [comment.id]: event.target.value,
                              }))
                            }
                            placeholder="Ajoutez votre réponse"
                          />
                        </label>
                        {replyError && <p className="feedback error">{replyError}</p>}
                        <button className="submit-button" type="submit" disabled={isReplySubmitting}>
                          {isReplySubmitting ? "Publication en cours…" : "Publier"}
                        </button>
                      </form>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </article>
  );
}
