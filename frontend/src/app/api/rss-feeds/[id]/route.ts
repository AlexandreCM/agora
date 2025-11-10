import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { deleteRssFeed, getRssFeed, updateRssFeed } from "@/lib/rss-feeds";
import type { UpdateRssFeedInput } from "@/lib/rss-feeds";
import { importPostsFromFeed } from "@/lib/rss-importer";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
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

  const existingFeed = await getRssFeed(id);

  if (!existingFeed) {
    return NextResponse.json(
      { message: "Flux introuvable." },
      { status: 404 },
    );
  }

  const updates: UpdateRssFeedInput = {};

  if (typeof body.label === "string") {
    if (!body.label.trim()) {
      return NextResponse.json(
        { message: "Le nom du flux ne peut pas être vide." },
        { status: 400 },
      );
    }
    updates.label = body.label.trim();
  }

  if (typeof body.url === "string") {
    try {
      const parsedUrl = new URL(body.url);
      if (!parsedUrl.protocol.startsWith("http")) {
        throw new Error("Invalid URL");
      }
      updates.url = body.url.trim();
    } catch (error) {
      return NextResponse.json(
        { message: "URL du flux invalide." },
        { status: 400 },
      );
    }
  }

  if (body.tags !== undefined) {
    updates.tags = Array.isArray(body.tags)
      ? body.tags.map((tag: unknown) => String(tag).trim()).filter(Boolean)
      : typeof body.tags === "string"
        ? body.tags
            .split(",")
            .map((tag: string) => tag.trim())
            .filter(Boolean)
        : [];
  }

  if (typeof body.active === "boolean") {
    updates.active = body.active;
  }

  const updatedFeed = await updateRssFeed(id, updates);

  if (!updatedFeed) {
    return NextResponse.json(
      { message: "Impossible de mettre à jour le flux." },
      { status: 500 },
    );
  }

  const shouldImport = Boolean(updates.active) && !existingFeed.active;

  if (shouldImport) {
    const importResult = await importPostsFromFeed(updatedFeed);
    const refreshedFeed = await updateRssFeed(id, { lastFetchedAt: new Date().toISOString() });

    return NextResponse.json({
      feed: refreshedFeed ?? updatedFeed,
      importResult,
    });
  }

  return NextResponse.json({ feed: updatedFeed });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    return NextResponse.json({ message: "Accès administrateur requis." }, { status: 403 });
  }

  const deleted = await deleteRssFeed(id);

  if (!deleted) {
    return NextResponse.json(
      { message: "Flux introuvable." },
      { status: 404 },
    );
  }

  return NextResponse.json({ success: true });
}
