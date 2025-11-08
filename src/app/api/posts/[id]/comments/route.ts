import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { addCommentToPost } from "@/lib/posts";
import { COMMENT_SECTIONS, type Comment, type CommentSection, type Post } from "@/types/post";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: {
    id: string;
  };
}

function normaliseSection(section: unknown): CommentSection {
  if (typeof section !== "string") {
    return "analysis";
  }

  const lowerCase = section.toLowerCase();
  return (COMMENT_SECTIONS.find((item) => item === lowerCase) ?? "analysis") as CommentSection;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = context.params;
  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ message: "Corps de requête manquant." }, { status: 400 });
  }

  const { section, author, content } = body as {
    section?: unknown;
    author?: unknown;
    content?: unknown;
  };

  if (typeof content !== "string" || content.trim().length === 0) {
    return NextResponse.json({ message: "Le commentaire est obligatoire." }, { status: 400 });
  }

  const normalisedSection = normaliseSection(section);
  const normalisedAuthor = typeof author === "string" && author.trim().length > 0 ? author.trim() : "Anonyme";

  const newComment: Comment = {
    id: randomUUID(),
    section: normalisedSection,
    author: normalisedAuthor,
    content: content.trim(),
    createdAt: new Date().toISOString(),
  };

  const updatedPost: Post | null = await addCommentToPost(id, newComment);

  if (!updatedPost) {
    return NextResponse.json({ message: "Publication introuvable." }, { status: 404 });
  }

  return NextResponse.json(updatedPost);
}
