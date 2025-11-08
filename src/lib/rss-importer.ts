import { randomUUID } from "node:crypto";

import { createPost, postExistsBySourceUrl } from "@/lib/posts";
import { createImportResult, fetchRssItems, summariseDescription } from "@/lib/rss";
import type { Post } from "@/types/post";
import type { RssFeed, RssImportResult } from "@/types/rss-feed";

export async function importPostsFromFeed(feed: RssFeed): Promise<RssImportResult> {
  const result = createImportResult();

  let items;
  try {
    items = await fetchRssItems(feed.url);
  } catch (error) {
    result.errors.push(
      error instanceof Error
        ? error.message
        : "Impossible de récupérer le flux RSS.",
    );
    return result;
  }

  for (const item of items) {
    result.processedItems += 1;

    const title = item.title.trim();
    const link = item.link.trim();

    if (!title || !link) {
      result.errors.push("Article ignoré : titre ou lien manquant.");
      continue;
    }

    const alreadyExists = await postExistsBySourceUrl(link);
    if (alreadyExists) {
      continue;
    }

    const summary = summariseDescription(item.description, item.title);

    const newPost: Post = {
      id: randomUUID(),
      title,
      summary,
      sourceUrl: link,
      tags: feed.tags,
      createdAt: new Date().toISOString(),
      likes: 0,
      comments: [],
    };

    try {
      await createPost(newPost);
      result.createdPosts += 1;
    } catch (error) {
      result.errors.push(
        error instanceof Error ? error.message : "Erreur inconnue lors de la création du post.",
      );
    }
  }

  return result;
}
