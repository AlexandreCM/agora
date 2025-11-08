import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { addCommentToPost, addReplyToComment } from "@/lib/posts";
import {
  COMMENT_SECTIONS,
  type Comment,
  type CommentReply,
  type CommentSection,
  type Post,
} from "@/types/post";

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
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Authentification requise." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ message: "Corps de requête manquant." }, { status: 400 });
  }

  const { section, content, parentId } = body as {
    section?: unknown;
    content?: unknown;
    parentId?: unknown;
  };

  if (typeof content !== "string" || content.trim().length === 0) {
    return NextResponse.json({ message: "Le commentaire est obligatoire." }, { status: 400 });
  }

  const normalisedParentId =
    typeof parentId === "string" && parentId.trim().length > 0 ? parentId.trim() : null;

  if (normalisedParentId) {
    const newReply: CommentReply = {
      id: randomUUID(),
      parentId: normalisedParentId,
      author: user.name,
      authorId: user.id,
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };

    const updatedPost = await addReplyToComment(id, normalisedParentId, newReply, user.id);

    if (!updatedPost) {
      return NextResponse.json({ message: "Commentaire introuvable." }, { status: 404 });
    }

    return NextResponse.json(updatedPost);
  }

  const normalisedSection = normaliseSection(section);

  const newComment: Comment = {
    id: randomUUID(),
    section: normalisedSection,
    author: user.name,
    authorId: user.id,
    content: content.trim(),
    createdAt: new Date().toISOString(),
    replies: [],
  };

  const updatedPost: Post | null = await addCommentToPost(id, newComment, user.id);

  if (!updatedPost) {
    return NextResponse.json({ message: "Publication introuvable." }, { status: 404 });
  }

  return NextResponse.json(updatedPost);
}
