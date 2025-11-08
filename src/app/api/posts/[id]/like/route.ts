import { NextResponse } from "next/server";
import { readPosts, writePosts } from "@/lib/posts";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: {
    id: string;
  };
}

export async function POST(_request: Request, context: RouteContext) {
  const { id } = context.params;
  const posts = await readPosts();
  const postIndex = posts.findIndex((post) => post.id === id);

  if (postIndex === -1) {
    return NextResponse.json({ message: "Publication introuvable." }, { status: 404 });
  }

  const updatedPost = {
    ...posts[postIndex],
    likes: posts[postIndex].likes + 1,
  };

  const updatedPosts = [...posts];
  updatedPosts[postIndex] = updatedPost;
  await writePosts(updatedPosts);

  return NextResponse.json(updatedPost);
}
