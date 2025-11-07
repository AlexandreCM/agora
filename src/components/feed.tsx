import { readPosts } from "@/lib/posts";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export async function Feed() {
  const posts = await readPosts();

  if (posts.length === 0) {
    return (
      <div className="empty-state">
        <h2>Encore aucun rapport</h2>
        <p>
          Ajoutez votre premier rapport via l'interface admin pour voir
          apparaître le flux.
        </p>
      </div>
    );
  }

  return (
    <div className="feed">
      {posts.map((post) => (
        <article className="post-card" key={post.id}>
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
            <a
              className="source-link"
              href={post.sourceUrl}
              target="_blank"
              rel="noreferrer"
            >
              Consulter la source ↗
            </a>
          </div>
        </article>
      ))}
    </div>
  );
}
