import { readPosts } from "@/lib/posts";
import { PostCard } from "@/components/post-card";

export async function Feed() {
  const posts = await readPosts();

  if (posts.length === 0) {
    return (
      <div className="empty-state">
        <h2>Encore aucun rapport</h2>
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
