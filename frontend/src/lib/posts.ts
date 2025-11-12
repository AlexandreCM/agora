import { dbAccessorFetch } from "@/lib/db-accessor-client";
import { getCurrentUser } from "@/lib/auth";
import { COMMENT_SECTIONS, type Comment, type CommentReply, type CommentSection, type Post } from "@/types/post";

interface DbAccessorCommentReply {
  id?: unknown;
  parentId?: unknown;
  author?: unknown;
  authorId?: unknown;
  content?: unknown;
  createdAt?: unknown;
}

interface DbAccessorComment {
  id?: unknown;
  section?: unknown;
  author?: unknown;
  authorId?: unknown;
  content?: unknown;
  createdAt?: unknown;
  replies?: unknown;
}

interface DbAccessorPost {
  id?: unknown;
  title?: unknown;
  summary?: unknown;
  sourceUrl?: unknown;
  tags?: unknown;
  createdAt?: unknown;
  likedBy?: unknown;
  comments?: unknown;
}

function normaliseString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function normaliseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function normaliseCommentReply(reply: DbAccessorCommentReply): CommentReply {
  return {
    id: normaliseString(reply.id),
    parentId: normaliseString(reply.parentId),
    author: normaliseString(reply.author),
    authorId: typeof reply.authorId === "string" ? reply.authorId : undefined,
    content: normaliseString(reply.content),
    createdAt: normaliseString(reply.createdAt),
  };
}

function normaliseSection(section: unknown): CommentSection {
  if (typeof section !== "string") {
    return "analysis";
  }

  const lowerCase = section.toLowerCase();
  return (COMMENT_SECTIONS.find((value) => value === lowerCase) ?? "analysis") as CommentSection;
}

function normaliseComment(comment: DbAccessorComment): Comment {
  const repliesValue = Array.isArray(comment.replies) ? comment.replies : [];

  return {
    id: normaliseString(comment.id),
    section: normaliseSection(comment.section),
    author: normaliseString(comment.author),
    authorId: typeof comment.authorId === "string" ? comment.authorId : undefined,
    content: normaliseString(comment.content),
    createdAt: normaliseString(comment.createdAt),
    replies: repliesValue.map((reply) => normaliseCommentReply(reply as DbAccessorCommentReply)),
  };
}

function normalisePost(post: DbAccessorPost, viewerId?: string | null): Post {
  const likedBy = normaliseStringArray(post.likedBy);
  const commentsValue = Array.isArray(post.comments) ? post.comments : [];

  return {
    id: normaliseString(post.id),
    title: normaliseString(post.title),
    summary: normaliseString(post.summary),
    sourceUrl: normaliseString(post.sourceUrl),
    tags: normaliseStringArray(post.tags),
    createdAt: normaliseString(post.createdAt),
    likes: likedBy.length,
    comments: commentsValue.map((comment) => normaliseComment(comment as DbAccessorComment)),
    viewerHasLiked: viewerId ? likedBy.includes(viewerId) : undefined,
  };
}

async function expectJson<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error("Réponse inattendue du service db-accessor");
  }
  return (await response.json()) as T;
}

export async function readPosts(): Promise<Post[]> {
  const viewer = await getCurrentUser().catch(() => null);
  const response = await dbAccessorFetch("/posts");

  if (!response.ok) {
    throw new Error("Impossible de récupérer les publications.");
  }

  const payload = await expectJson<DbAccessorPost[]>(response);
  return payload.map((post) => normalisePost(post, viewer?.id));
}

export async function readPostById(id: string): Promise<Post | null> {
  const viewer = await getCurrentUser().catch(() => null);
  const response = await dbAccessorFetch(`/posts/${encodeURIComponent(id)}`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Impossible de récupérer la publication.");
  }

  const payload = await expectJson<DbAccessorPost>(response);
  return normalisePost(payload, viewer?.id);
}

export async function createPost(post: Post): Promise<Post> {
  const payload = {
    id: post.id,
    title: post.title,
    summary: post.summary,
    sourceUrl: post.sourceUrl,
    tags: post.tags,
  };

  const response = await dbAccessorFetch("/posts", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Impossible de créer la publication.");
  }

  const result = await expectJson<DbAccessorPost>(response);
  return normalisePost(result);
}

export async function togglePostLikeByUser(postId: string, userId: string): Promise<Post | null> {
  const response = await dbAccessorFetch(`/posts/${encodeURIComponent(postId)}/like`, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Impossible de mettre à jour le like de la publication.");
  }

  const post = await expectJson<DbAccessorPost>(response);
  return normalisePost(post, userId);
}

export async function addCommentToPost(
  id: string,
  comment: Comment,
  viewerId?: string,
): Promise<Post | null> {
  const response = await dbAccessorFetch(
    `/posts/${encodeURIComponent(id)}/comments`,
    {
      method: "POST",
      body: JSON.stringify({ comment }),
    },
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Impossible d'ajouter le commentaire.");
  }

  const payload = await expectJson<DbAccessorPost>(response);
  return normalisePost(payload, viewerId);
}

export async function addReplyToComment(
  id: string,
  parentId: string,
  reply: CommentReply,
  viewerId?: string,
): Promise<Post | null> {
  const response = await dbAccessorFetch(
    `/posts/${encodeURIComponent(id)}/comments`,
    {
      method: "POST",
      body: JSON.stringify({
        reply: {
          ...reply,
          parentId,
        },
      }),
    },
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Impossible d'ajouter la réponse.");
  }

  const payload = await expectJson<DbAccessorPost>(response);
  return normalisePost(payload, viewerId);
}
