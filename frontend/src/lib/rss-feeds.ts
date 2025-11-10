import { randomUUID } from "node:crypto";
import { ObjectId } from "mongodb";

import { getDb } from "@/lib/mongodb";
import type { RssFeed } from "@/types/rss-feed";

type MongoRssFeedDocument = RssFeed & { _id?: string | ObjectId };

const COLLECTION_NAME = "rssFeeds";

function normaliseTags(rawTags: unknown): string[] {
  if (Array.isArray(rawTags)) {
    return rawTags.map((tag) => String(tag).trim()).filter(Boolean);
  }

  if (typeof rawTags === "string") {
    return rawTags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
}

function ensureRssFeedShape(rawFeed: Partial<MongoRssFeedDocument>): RssFeed {
  const idSource = rawFeed.id ?? rawFeed._id ?? randomUUID();
  const id = idSource instanceof ObjectId ? idSource.toHexString() : String(idSource);

  const createdAtDate = rawFeed.createdAt ? new Date(rawFeed.createdAt) : new Date();
  const createdAt = Number.isNaN(createdAtDate.getTime())
    ? new Date().toISOString()
    : createdAtDate.toISOString();

  const lastFetchedAtDate = rawFeed.lastFetchedAt ? new Date(rawFeed.lastFetchedAt) : null;
  const lastFetchedAt = lastFetchedAtDate && !Number.isNaN(lastFetchedAtDate.getTime())
    ? lastFetchedAtDate.toISOString()
    : null;

  return {
    id,
    label: rawFeed.label ? String(rawFeed.label) : rawFeed.url ? String(rawFeed.url) : "",
    url: rawFeed.url ? String(rawFeed.url) : "",
    tags: normaliseTags(rawFeed.tags),
    active: Boolean(rawFeed.active),
    createdAt,
    lastFetchedAt,
  };
}

export async function readRssFeeds(): Promise<RssFeed[]> {
  const db = await getDb();
  const documents = await db
    .collection<MongoRssFeedDocument>(COLLECTION_NAME)
    .find({})
    .sort({ createdAt: -1 })
    .toArray();

  return documents.map((document) => ensureRssFeedShape(document));
}

export interface CreateRssFeedInput {
  label: string;
  url: string;
  tags: string[];
  active: boolean;
}

export async function createRssFeed(input: CreateRssFeedInput): Promise<RssFeed> {
  const db = await getDb();
  const collection = db.collection<MongoRssFeedDocument>(COLLECTION_NAME);

  const feed: RssFeed = {
    id: randomUUID(),
    label: input.label.trim(),
    url: input.url.trim(),
    tags: normaliseTags(input.tags),
    active: Boolean(input.active),
    createdAt: new Date().toISOString(),
    lastFetchedAt: null,
  };

  await collection.insertOne({ ...feed, _id: feed.id });

  return feed;
}

export interface UpdateRssFeedInput {
  label?: string;
  url?: string;
  tags?: string[] | string;
  active?: boolean;
  lastFetchedAt?: string | null;
}

export async function getRssFeed(id: string): Promise<RssFeed | null> {
  const db = await getDb();
  const collection = db.collection<MongoRssFeedDocument>(COLLECTION_NAME);

  const filter = buildFeedFilter(id);
  const document = await collection.findOne(filter);

  return document ? ensureRssFeedShape(document) : null;
}

export async function updateRssFeed(
  id: string,
  input: UpdateRssFeedInput,
): Promise<RssFeed | null> {
  const db = await getDb();
  const collection = db.collection<MongoRssFeedDocument>(COLLECTION_NAME);

  const filter = buildFeedFilter(id);

  const updatePayload: Record<string, unknown> = {};

  if (typeof input.label === "string") {
    updatePayload.label = input.label.trim();
  }

  if (typeof input.url === "string") {
    updatePayload.url = input.url.trim();
  }

  if (input.tags !== undefined) {
    updatePayload.tags = normaliseTags(input.tags);
  }

  if (typeof input.active === "boolean") {
    updatePayload.active = input.active;
  }

  if (input.lastFetchedAt !== undefined) {
    updatePayload.lastFetchedAt = input.lastFetchedAt;
  }

  if (!Object.keys(updatePayload).length) {
    const existing = await collection.findOne(filter);
    return existing ? ensureRssFeedShape(existing) : null;
  }

  await collection.updateOne(filter, { $set: updatePayload });

  const updatedDocument = await collection.findOne(filter);

  return updatedDocument ? ensureRssFeedShape(updatedDocument) : null;
}

export async function deleteRssFeed(id: string): Promise<boolean> {
  const db = await getDb();
  const collection = db.collection<MongoRssFeedDocument>(COLLECTION_NAME);

  const result = await collection.deleteOne(buildFeedFilter(id));
  return result.deletedCount === 1;
}

function buildFeedFilter(id: string) {
  const filters: Record<string, unknown>[] = [{ id }];

  if (ObjectId.isValid(id)) {
    filters.push({ _id: new ObjectId(id) });
    filters.push({ _id: id });
  }

  return { $or: filters };
}
