import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { togglePostLikeByUser } from "@/lib/posts";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: {
    id: string;
  };
}

export async function POST(_request: Request, context: RouteContext) {
  const { id: postId } = context.params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Authentification requise." }, { status: 401 });
  }

  const updatedPost = await togglePostLikeByUser(postId, user.id);

  if (!updatedPost) {
    return NextResponse.json({ message: "Publication introuvable." }, { status: 404 });
  }

  return NextResponse.json(updatedPost);
}
