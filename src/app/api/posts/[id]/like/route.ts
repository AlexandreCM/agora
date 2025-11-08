import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { likePostByUser } from "@/lib/posts";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: {
    id: string;
  };
}

export async function POST(_request: Request, context: RouteContext) {
  const { id } = context.params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Authentification requise." }, { status: 401 });
  }

  const result = await likePostByUser(id, user.id);
  const updatedPost = result.post;

  if (!updatedPost) {
    return NextResponse.json({ message: "Publication introuvable." }, { status: 404 });
  }

  return NextResponse.json(updatedPost);
}
