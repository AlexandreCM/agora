import { getDb } from "@/lib/mongodb";
import { COMMENT_SECTIONS } from "@/types/post";
import type { Comment, CommentSection, Post } from "@/types/post";

type MongoPostDocument = Post & { _id?: string };

const POSTS_COLLECTION = "posts";

function ensurePostShape(rawPost: Partial<MongoPostDocument>): Post {
  const comments = Array.isArray(rawPost.comments)
    ? rawPost.comments.map((comment) => ensureCommentShape(comment))
    : [];

  const id = String(rawPost.id ?? rawPost._id ?? "");

  return {
    id,
    title: String(rawPost.title ?? ""),
    summary: String(rawPost.summary ?? ""),
    sourceUrl: String(rawPost.sourceUrl ?? ""),
    tags: Array.isArray(rawPost.tags) ? rawPost.tags.map((tag) => String(tag)) : [],
    createdAt: rawPost.createdAt ?? new Date().toISOString(),
    likes:
      typeof rawPost.likes === "number" && Number.isFinite(rawPost.likes)
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
  const db = await getDb();
  const documents = await db
    .collection<MongoPostDocument>(POSTS_COLLECTION)
    .find({})
    .sort({ createdAt: -1 })
    .toArray();

  const posts = documents.map((document) => ensurePostShape(document));

  return posts.sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

export async function createPost(post: Post): Promise<Post> {
  const db = await getDb();
  const collection = db.collection<MongoPostDocument>(POSTS_COLLECTION);

  const ensuredPost = ensurePostShape(post);

  if (!ensuredPost.id) {
    throw new Error("Post id is required");
  }

  await collection.insertOne({ ...ensuredPost, _id: ensuredPost.id });

  return ensuredPost;
}

export async function incrementPostLikes(id: string): Promise<Post | null> {
  const db = await getDb();
  const collection = db.collection<MongoPostDocument>(POSTS_COLLECTION);

  const result = await collection.findOneAndUpdate(
    { $or: [{ _id: id }, { id }] },
    { $inc: { likes: 1 } },
    { returnDocument: "after" },
  );

  return result.value ? ensurePostShape(result.value) : null;
}

export async function addCommentToPost(id: string, comment: Comment): Promise<Post | null> {
  const db = await getDb();
  const collection = db.collection<MongoPostDocument>(POSTS_COLLECTION);

  const ensuredComment = ensureCommentShape(comment);

  const result = await collection.findOneAndUpdate(
    { $or: [{ _id: id }, { id }] },
    { $push: { comments: ensuredComment } },
    { returnDocument: "after" },
  );

  return result.value ? ensurePostShape(result.value) : null;
}
