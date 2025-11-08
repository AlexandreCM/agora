import { ObjectId, type Filter } from "mongodb";

import { getDb } from "@/lib/mongodb";
import { COMMENT_SECTIONS } from "@/types/post";
import type { Comment, CommentSection, Post } from "@/types/post";

type MongoPostDocument = Omit<Post, "viewerHasLiked"> & {
  _id?: string | ObjectId;
  likedBy?: (string | ObjectId)[];
};

interface NormalisedPost extends Omit<Post, "viewerHasLiked"> {
  likedBy: string[];
}

const POSTS_COLLECTION = "posts";

function normaliseLikedBy(rawLikedBy: MongoPostDocument["likedBy"]): string[] {
  if (!Array.isArray(rawLikedBy)) {
    return [];
  }

  return rawLikedBy
    .map((value) => (value instanceof ObjectId ? value.toHexString() : String(value)))
    .filter((value) => Boolean(value));
}

function ensurePostShape(rawPost: Partial<MongoPostDocument>): NormalisedPost {
  const comments = Array.isArray(rawPost.comments)
    ? rawPost.comments.map((comment) => ensureCommentShape(comment))
    : [];

  const idSource = rawPost.id ?? rawPost._id ?? "";
  const id = idSource instanceof ObjectId ? idSource.toHexString() : String(idSource);
  const parsedCreatedAt = rawPost.createdAt ? new Date(rawPost.createdAt) : null;
  const createdAt = parsedCreatedAt && !Number.isNaN(parsedCreatedAt.getTime())
    ? parsedCreatedAt.toISOString()
    : new Date().toISOString();

  const likedBy = normaliseLikedBy(rawPost.likedBy);
  const likes =
    likedBy.length > 0
      ? likedBy.length
      : typeof rawPost.likes === "number" && Number.isFinite(rawPost.likes)
        ? rawPost.likes
        : 0;

  return {
    id,
    title: String(rawPost.title ?? ""),
    summary: String(rawPost.summary ?? ""),
    sourceUrl: String(rawPost.sourceUrl ?? ""),
    tags: Array.isArray(rawPost.tags) ? rawPost.tags.map((tag) => String(tag)) : [],
    createdAt,
    likes,
    comments,
    likedBy,
  };
}

function ensureCommentShape(rawComment: Partial<Comment>): Comment {
  const defaultSection: CommentSection = "analysis";
  const section = COMMENT_SECTIONS.includes((rawComment.section as CommentSection) ?? defaultSection)
    ? ((rawComment.section as CommentSection) ?? defaultSection)
    : defaultSection;

  const parsedCreatedAt = rawComment.createdAt ? new Date(rawComment.createdAt) : null;
  const createdAt = parsedCreatedAt && !Number.isNaN(parsedCreatedAt.getTime())
    ? parsedCreatedAt.toISOString()
    : new Date().toISOString();

  return {
    id: String(rawComment.id ?? ""),
    section,
    author: rawComment.author ? String(rawComment.author) : "Anonyme",
    authorId: rawComment.authorId ? String(rawComment.authorId) : undefined,
    content: String(rawComment.content ?? ""),
    createdAt,
  };
}

function buildPostFilter(id: string): Filter<MongoPostDocument> {
  const filters: Record<string, unknown>[] = [{ id }, { _id: id }];

  if (ObjectId.isValid(id)) {
    filters.push({ _id: new ObjectId(id) });
  }

  return { $or: filters } as Filter<MongoPostDocument>;
}

function toPostForViewer(post: NormalisedPost, viewerId?: string): Post {
  const { likedBy, ...rest } = post;
  const viewerHasLiked = viewerId ? likedBy.includes(viewerId) : undefined;

  return {
    ...rest,
    viewerHasLiked,
  };
}

export async function readPosts(viewerId?: string): Promise<Post[]> {
  const db = await getDb();
  const documents = await db
    .collection<MongoPostDocument>(POSTS_COLLECTION)
    .find({})
    .sort({ createdAt: -1 })
    .toArray();

  const normalised = documents.map((document) => ensurePostShape(document));
  const posts = normalised.map((post) => toPostForViewer(post, viewerId));

  return posts.sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

export async function readPostById(id: string, viewerId?: string): Promise<Post | null> {
  const db = await getDb();
  const collection = db.collection<MongoPostDocument>(POSTS_COLLECTION);
  const filter = buildPostFilter(id);

  const document = await collection.findOne(filter);

  if (!document) {
    return null;
  }

  const normalised = ensurePostShape(document);
  return toPostForViewer(normalised, viewerId);
}

export async function createPost(post: Post): Promise<Post> {
  const db = await getDb();
  const collection = db.collection<MongoPostDocument>(POSTS_COLLECTION);

  if (!post.id) {
    throw new Error("Post id is required");
  }

  const document: MongoPostDocument = {
    id: post.id,
    title: post.title,
    summary: post.summary,
    sourceUrl: post.sourceUrl,
    tags: post.tags,
    createdAt: post.createdAt,
    likes: 0,
    comments: post.comments.map((comment) => ensureCommentShape(comment)),
    likedBy: [],
  };

  await collection.insertOne({ ...document, _id: document.id });

  const normalised = ensurePostShape(document);
  return toPostForViewer(normalised);
}

export async function findPostBySourceUrl(sourceUrl: string): Promise<Post | null> {
  const db = await getDb();
  const collection = db.collection<MongoPostDocument>(POSTS_COLLECTION);

  const document = await collection.findOne({ sourceUrl });

  if (!document) {
    return null;
  }

  const normalised = ensurePostShape(document);
  return toPostForViewer(normalised);
}

export async function postExistsBySourceUrl(sourceUrl: string): Promise<boolean> {
  const db = await getDb();
  const collection = db.collection<MongoPostDocument>(POSTS_COLLECTION);

  const count = await collection.countDocuments({ sourceUrl }, { limit: 1 });

  return count > 0;
}

export async function togglePostLikeByUser(
  id: string,
  userId: string,
): Promise<{ post: Post | null; viewerHasLiked: boolean }> {
  const db = await getDb();
  const collection = db.collection<MongoPostDocument>(POSTS_COLLECTION);
  const filter = buildPostFilter(id);

  const existingDocument = await collection.findOne(filter);

  if (!existingDocument) {
    return { post: null, viewerHasLiked: false };
  }

  const likedBy = normaliseLikedBy(existingDocument.likedBy);
  const alreadyLiked = likedBy.includes(userId);

  const removalTargets: (string | ObjectId)[] = [userId];

  if (ObjectId.isValid(userId)) {
    removalTargets.push(new ObjectId(userId));
  }

  const update = alreadyLiked
    ? { $pull: { likedBy: { $in: removalTargets } } }
    : { $addToSet: { likedBy: userId } };

  const updateResult = await collection.updateOne(filter, update);

  if (!updateResult.matchedCount) {
    return { post: null, viewerHasLiked: alreadyLiked };
  }

  const updatedDocument = await collection.findOne(filter);

  if (!updatedDocument) {
    return { post: null, viewerHasLiked: alreadyLiked };
  }

  const normalised = ensurePostShape(updatedDocument);

  return {
    post: toPostForViewer(normalised, userId),
    viewerHasLiked: !alreadyLiked,
  };
}

export async function addCommentToPost(
  id: string,
  comment: Comment,
  viewerId?: string,
): Promise<Post | null> {
  const db = await getDb();
  const collection = db.collection<MongoPostDocument>(POSTS_COLLECTION);

  const ensuredComment = ensureCommentShape(comment);
  const filter = buildPostFilter(id);

  const updateResult = await collection.updateOne(filter, { $push: { comments: ensuredComment } });

  if (!updateResult.matchedCount) {
    return null;
  }

  const updatedDocument = await collection.findOne(filter);

  if (!updatedDocument) {
    return null;
  }

  const normalised = ensurePostShape(updatedDocument);
  return toPostForViewer(normalised, viewerId);
}
