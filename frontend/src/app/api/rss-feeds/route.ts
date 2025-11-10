import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { createRssFeed, readRssFeeds, updateRssFeed } from "@/lib/rss-feeds";
import { importPostsFromFeed } from "@/lib/rss-importer";

export const dynamic = "force-dynamic";

export async function GET() {
  const feeds = await readRssFeeds();
  return NextResponse.json(feeds);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    return NextResponse.json({ message: "Accès administrateur requis." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json(
      { message: "Corps de requête manquant." },
      { status: 400 },
    );
  }

  const { label, url, tags, active = false } = body;

  if (!label || !url) {
    return NextResponse.json(
      { message: "Label et URL sont obligatoires." },
      { status: 400 },
    );
  }

  if (typeof label !== "string" || typeof url !== "string") {
    return NextResponse.json(
      { message: "Champs invalides." },
      { status: 400 },
    );
  }

  try {
    const parsedUrl = new URL(url);
    if (!parsedUrl.protocol.startsWith("http")) {
      throw new Error("Invalid URL");
    }
  } catch (error) {
    return NextResponse.json(
      { message: "URL du flux invalide." },
      { status: 400 },
    );
  }

  const normalisedTags = Array.isArray(tags)
    ? tags.map((tag: unknown) => String(tag).trim()).filter(Boolean)
    : typeof tags === "string"
      ? tags.split(",").map((tag: string) => tag.trim()).filter(Boolean)
      : [];

  const createdFeed = await createRssFeed({
    label: label.trim(),
    url: url.trim(),
    tags: normalisedTags,
    active: Boolean(active),
  });

  if (createdFeed.active) {
    const importResult = await importPostsFromFeed(createdFeed);
    const updatedFeed = await updateRssFeed(createdFeed.id, {
      lastFetchedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      feed: updatedFeed ?? createdFeed,
      importResult,
    }, { status: 201 });
  }

  return NextResponse.json({ feed: createdFeed }, { status: 201 });
}
