import { NextResponse } from "next/server";
import { incrementPostLikes } from "@/lib/posts";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: {
    id: string;
  };
}

export async function POST(_request: Request, context: RouteContext) {
  const { id } = context.params;
  const updatedPost = await incrementPostLikes(id);

  if (!updatedPost) {
    return NextResponse.json({ message: "Publication introuvable." }, { status: 404 });
  }

  return NextResponse.json(updatedPost);
}
