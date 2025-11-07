import { promises as fs } from "node:fs";
import path from "node:path";
import type { Post } from "@/types/post";

const postsFilePath = path.join(process.cwd(), "data", "posts.json");

export async function readPosts(): Promise<Post[]> {
  try {
    const file = await fs.readFile(postsFilePath, "utf-8");
    const data = JSON.parse(file) as Post[];
    return data.sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      await writePosts([]);
      return [];
    }

    throw error;
  }
}

export async function writePosts(posts: Post[]): Promise<void> {
  await fs.mkdir(path.dirname(postsFilePath), { recursive: true });
  await fs.writeFile(postsFilePath, JSON.stringify(posts, null, 2), "utf-8");
}
