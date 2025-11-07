import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { readPosts, writePosts } from "@/lib/posts";
import type { Post } from "@/types/post";

const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? "changeme";

export const dynamic = "force-dynamic";

export async function GET() {
  const posts = await readPosts();
  return NextResponse.json(posts);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const providedToken = request.headers.get("x-admin-token") ?? body?.token;

  if (!providedToken || providedToken !== ADMIN_TOKEN) {
    return NextResponse.json(
      {
        message: "Jeton administrateur invalide.",
      },
      { status: 401 },
    );
  }

  if (!body) {
    return NextResponse.json(
      {
        message: "Corps de requête manquant.",
      },
      { status: 400 },
    );
  }

  const { title, summary, sourceUrl, tags } = body;

  if (!title || !summary || !sourceUrl) {
    return NextResponse.json(
      {
        message: "Titre, résumé et lien source sont obligatoires.",
      },
      { status: 400 },
    );
  }

  if (typeof title !== "string" || typeof summary !== "string" || typeof sourceUrl !== "string") {
    return NextResponse.json(
      {
        message: "Champs invalides.",
      },
      { status: 400 },
    );
  }

  try {
    const url = new URL(sourceUrl);
    if (!url.protocol.startsWith("http")) {
      throw new Error("Invalid URL");
    }
  } catch (error) {
    return NextResponse.json(
      {
        message: "Lien source invalide.",
      },
      { status: 400 },
    );
  }

  const normalisedTags = Array.isArray(tags)
    ? tags.map((tag) => String(tag).trim()).filter(Boolean)
    : typeof tags === "string"
      ? tags
          .split(",")
          .map((tag: string) => tag.trim())
          .filter(Boolean)
      : [];

  const newPost: Post = {
    id: randomUUID(),
    title: title.trim(),
    summary: summary.trim(),
    sourceUrl: sourceUrl.trim(),
    tags: normalisedTags,
    createdAt: new Date().toISOString(),
  };

  const posts = await readPosts();
  const updatedPosts = [newPost, ...posts];
  await writePosts(updatedPosts);

  return NextResponse.json(newPost, { status: 201 });
}
