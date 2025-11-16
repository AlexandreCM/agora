import { ObjectId, type Filter } from "mongodb";

import { getDb } from "@/lib/mongodb";
import { COMMENT_SECTIONS } from "@/types/post";
import type { Comment, CommentReply, CommentSection, Post } from "@/types/post";

type MongoPostDocument = Omit<Post, "likedBy"> & {
  _id?: string | ObjectId;
  likedBy?: (string | ObjectId)[];
};

type RawComment = Partial<Comment> & { author?: string };
type RawCommentReply = Partial<CommentReply> & { author?: string };

const POSTS_COLLECTION = "posts";

function normaliseLikedBy(rawLikedBy: MongoPostDocument["likedBy"]): string[] {
  if (!Array.isArray(rawLikedBy)) {
    return [];
  }

  return rawLikedBy
    .map((value) => (value instanceof ObjectId ? value.toHexString() : String(value)))
    .filter((value) => Boolean(value));
}

function ensurePostShape(rawPost: Partial<MongoPostDocument>): Post {
  const comments = Array.isArray(rawPost.comments)
    ? rawPost.comments.map((comment) => ensureCommentShape(comment as RawComment))
    : [];

  const idSource = rawPost.id ?? rawPost._id ?? "";
  const id = idSource instanceof ObjectId ? idSource.toHexString() : String(idSource);
  const parsedCreatedAt = rawPost.createdAt ? new Date(rawPost.createdAt) : null;
  const createdAt = parsedCreatedAt && !Number.isNaN(parsedCreatedAt.getTime())
    ? parsedCreatedAt.toISOString()
    : new Date().toISOString();
  const parsedUpdatedAt = rawPost.updatedAt ? new Date(rawPost.updatedAt) : null;
  const updatedAt = parsedUpdatedAt && !Number.isNaN(parsedUpdatedAt.getTime())
    ? parsedUpdatedAt.toISOString()
    : createdAt;

  const likedBy = normaliseLikedBy(rawPost.likedBy);

  return {
    id,
    title: String(rawPost.title ?? ""),
    summary: String(rawPost.summary ?? ""),
    sourceUrl: String(rawPost.sourceUrl ?? ""),
    tags: Array.isArray(rawPost.tags) ? rawPost.tags.map((tag) => String(tag)) : [],
    createdAt,
    updatedAt,
    likedBy,
    comments,
  };
}

function ensureReplyShape(rawReply: RawCommentReply, fallbackParentId: string): CommentReply {
  const parsedCreatedAt = rawReply.createdAt ? new Date(rawReply.createdAt) : null;
  const createdAt =
    parsedCreatedAt && !Number.isNaN(parsedCreatedAt.getTime())
      ? parsedCreatedAt.toISOString()
      : new Date().toISOString();

  const parentId = rawReply.parentId ?? fallbackParentId;

  return {
    id: String(rawReply.id ?? ""),
    parentId: String(parentId ?? fallbackParentId),
    authorId: rawReply.authorId ? String(rawReply.authorId) : "",
    authorName: rawReply.authorName
      ? String(rawReply.authorName)
      : rawReply.author
        ? String(rawReply.author)
        : "Anonyme",
    content: String(rawReply.content ?? ""),
    createdAt,
  };
}

function ensureCommentShape(rawComment: RawComment): Comment {
  const defaultSection: CommentSection = "analysis";
  const section = COMMENT_SECTIONS.includes((rawComment.section as CommentSection) ?? defaultSection)
    ? ((rawComment.section as CommentSection) ?? defaultSection)
    : defaultSection;

  const parsedCreatedAt = rawComment.createdAt ? new Date(rawComment.createdAt) : null;
  const createdAt = parsedCreatedAt && !Number.isNaN(parsedCreatedAt.getTime())
    ? parsedCreatedAt.toISOString()
    : new Date().toISOString();

  const commentId = String(rawComment.id ?? "");
  const rawReplies =
    rawComment && typeof rawComment === "object" && "replies" in rawComment
      ? (rawComment as { replies?: RawCommentReply[] }).replies
      : undefined;
  const replies = Array.isArray(rawReplies)
    ? rawReplies.map((reply) => ensureReplyShape(reply, commentId))
    : [];

  return {
    id: commentId,
    section,
    authorId: rawComment.authorId ? String(rawComment.authorId) : "",
    authorName: rawComment.authorName
      ? String(rawComment.authorName)
      : rawComment.author
        ? String(rawComment.author)
        : "Anonyme",
    content: String(rawComment.content ?? ""),
    createdAt,
    replies,
  };
}

function buildPostFilter(id: string): Filter<MongoPostDocument> {
  const filters: Record<string, unknown>[] = [{ id }, { _id: id }];

  if (ObjectId.isValid(id)) {
    filters.push({ _id: new ObjectId(id) });
  }

  return { $or: filters } as Filter<MongoPostDocument>;
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

export async function readPostById(id: string): Promise<Post | null> {
  const db = await getDb();
  const collection = db.collection<MongoPostDocument>(POSTS_COLLECTION);
  const filter = buildPostFilter(id);

  const document = await collection.findOne(filter);

  if (!document) {
    return null;
  }

  return ensurePostShape(document);
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
    updatedAt: post.updatedAt ?? post.createdAt,
    comments: post.comments.map((comment) => ensureCommentShape(comment)),
    likedBy: post.likedBy,
  };

  await collection.insertOne({ ...document, _id: document.id });

  return ensurePostShape(document);
}

export async function findPostBySourceUrl(sourceUrl: string): Promise<Post | null> {
  const db = await getDb();
  const collection = db.collection<MongoPostDocument>(POSTS_COLLECTION);

  const document = await collection.findOne({ sourceUrl });

  if (!document) {
    return null;
  }

  return ensurePostShape(document);
}

export async function postExistsBySourceUrl(sourceUrl: string): Promise<boolean> {
  const db = await getDb();
  const collection = db.collection<MongoPostDocument>(POSTS_COLLECTION);

  const count = await collection.countDocuments({ sourceUrl }, { limit: 1 });

  return count > 0;
}

export async function togglePostLikeByUser(id: string, userId: string): Promise<Post | null> {
  const db = await getDb();
  const collection = db.collection<MongoPostDocument>(POSTS_COLLECTION);
  const filter = buildPostFilter(id);

  const existingDocument = await collection.findOne(filter);

  if (!existingDocument) {
    return null;
  }

  const likedBy = normaliseLikedBy(existingDocument.likedBy);
  const alreadyLiked = likedBy.includes(userId);

  const removalTargets: (string | ObjectId)[] = [userId];

  if (ObjectId.isValid(userId)) {
    removalTargets.push(new ObjectId(userId));
  }

  const now = new Date().toISOString();
  const update = alreadyLiked
    ? { $pull: { likedBy: { $in: removalTargets } }, $set: { updatedAt: now } }
    : { $addToSet: { likedBy: userId }, $set: { updatedAt: now } };

  const updateResult = await collection.updateOne(filter, update);

  if (!updateResult.matchedCount) {
    return null;
  }

  const updatedDocument = await collection.findOne(filter);

  if (!updatedDocument) {
    return null;
  }

  return ensurePostShape(updatedDocument);
}

export async function addCommentToPost(
  id: string,
  comment: Comment,
): Promise<Post | null> {
  const db = await getDb();
  const collection = db.collection<MongoPostDocument>(POSTS_COLLECTION);

  const ensuredComment = ensureCommentShape(comment);
  const filter = buildPostFilter(id);

  const updateResult = await collection.updateOne(filter, {
    $push: { comments: ensuredComment },
    $set: { updatedAt: new Date().toISOString() },
  });

  if (!updateResult.matchedCount) {
    return null;
  }

  const updatedDocument = await collection.findOne(filter);

  if (!updatedDocument) {
    return null;
  }

  return ensurePostShape(updatedDocument);
}

export async function addReplyToComment(
  id: string,
  parentId: string,
  reply: CommentReply,
): Promise<Post | null> {
  const db = await getDb();
  const collection = db.collection<MongoPostDocument>(POSTS_COLLECTION);

  const ensuredReply = ensureReplyShape(reply, parentId);
  ensuredReply.parentId = parentId;

  const filter = { ...buildPostFilter(id), "comments.id": parentId } as Filter<MongoPostDocument>;
  const updateResult = await collection.updateOne(filter, {
    $push: { "comments.$.replies": ensuredReply },
    $set: { updatedAt: new Date().toISOString() },
  });

  if (!updateResult.matchedCount) {
    return null;
  }

  const updatedDocument = await collection.findOne(buildPostFilter(id));

  if (!updatedDocument) {
    return null;
  }

  return ensurePostShape(updatedDocument);
}
