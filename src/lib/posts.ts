import { promises as fs } from "node:fs";
import path from "node:path";
import { COMMENT_SECTIONS } from "@/types/post";
import type { Comment, CommentSection, Post } from "@/types/post";

const postsFilePath = path.join(process.cwd(), "data", "posts.json");

function ensurePostShape(rawPost: Partial<Post>): Post {
  const comments = Array.isArray(rawPost.comments)
    ? rawPost.comments.map((comment) => ensureCommentShape(comment))
    : [];

  return {
    id: String(rawPost.id ?? ""),
    title: String(rawPost.title ?? ""),
    summary: String(rawPost.summary ?? ""),
    sourceUrl: String(rawPost.sourceUrl ?? ""),
    tags: Array.isArray(rawPost.tags) ? rawPost.tags.map((tag) => String(tag)) : [],
    createdAt: rawPost.createdAt ?? new Date().toISOString(),
    likes: typeof rawPost.likes === "number" && Number.isFinite(rawPost.likes)
      ? rawPost.likes
      : 0,
    comments,
  };
}

function ensureCommentShape(rawComment: Partial<Comment>): Comment {
  const defaultSection: CommentSection = "analysis";
  const section = COMMENT_SECTIONS.includes((rawComment.section as CommentSection) ?? defaultSection)
    ? ((rawComment.section as CommentSection) ?? defaultSection)
    : defaultSection;

  return {
    id: String(rawComment.id ?? ""),
    section,
    author: rawComment.author ? String(rawComment.author) : "Anonyme",
    content: String(rawComment.content ?? ""),
    createdAt: rawComment.createdAt ?? new Date().toISOString(),
  };
}

export async function readPosts(): Promise<Post[]> {
  try {
    const file = await fs.readFile(postsFilePath, "utf-8");
    const rawData = JSON.parse(file) as Partial<Post>[];
    const data = rawData.map((post) => ensurePostShape(post));
    return data.sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      await writePosts([]);
      return [];
    }

    throw error;
  }
}

export async function writePosts(posts: Post[]): Promise<void> {
  await fs.mkdir(path.dirname(postsFilePath), { recursive: true });
  await fs.writeFile(postsFilePath, JSON.stringify(posts, null, 2), "utf-8");
}
