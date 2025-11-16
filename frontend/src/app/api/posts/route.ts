import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { readPosts } from "@/lib/posts";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  const posts = await readPosts(user?.id);
  return NextResponse.json(posts);
}
