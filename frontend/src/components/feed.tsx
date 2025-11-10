import { getCurrentUser } from "@/lib/auth";
import { readPosts } from "@/lib/posts";
import { PostCard } from "@/components/post-card";

export async function Feed() {
  const user = await getCurrentUser();
  const posts = await readPosts(user?.id);

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
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
