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
