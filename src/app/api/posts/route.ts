import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { createPost, readPosts } from "@/lib/posts";
import type { Post } from "@/types/post";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  const posts = await readPosts(user?.id);
  return NextResponse.json(posts);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    return NextResponse.json(
      {
        message: "Accès administrateur requis.",
      },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);

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
    likes: 0,
    comments: [],
  };

  const createdPost = await createPost(newPost);

  return NextResponse.json(createdPost, { status: 201 });
}
