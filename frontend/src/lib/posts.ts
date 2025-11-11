import { dbAccessorFetch } from "@/lib/db-accessor-client";
import type { Comment, CommentReply, Post } from "@/types/post";

function buildQuery(params: Record<string, string | undefined>) {
  const entries = Object.entries(params).filter(([, value]) => typeof value === "string" && value.length > 0);

  if (!entries.length) {
    return "";
  }

  const query = new URLSearchParams();
  for (const [key, value] of entries) {
    if (value) {
      query.set(key, value);
    }
  }

  return `?${query.toString()}`;
}

async function expectJson<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error("Réponse inattendue du service db-accessor");
  }
  return (await response.json()) as T;
}

export async function readPosts(viewerId?: string): Promise<Post[]> {
  const response = await dbAccessorFetch(`/posts${buildQuery({ viewerId })}`);

  if (!response.ok) {
    throw new Error("Impossible de récupérer les publications.");
  }

  return expectJson<Post[]>(response);
}

export async function readPostById(id: string, viewerId?: string): Promise<Post | null> {
  const response = await dbAccessorFetch(`/posts/${encodeURIComponent(id)}${buildQuery({ viewerId })}`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Impossible de récupérer la publication.");
  }

  return expectJson<Post>(response);
}

export async function createPost(post: Post): Promise<Post> {
  const payload = {
    id: post.id,
    title: post.title,
    summary: post.summary,
    sourceUrl: post.sourceUrl,
    tags: post.tags,
  };

  const response = await dbAccessorFetch("/posts", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Impossible de créer la publication.");
  }

  return expectJson<Post>(response);
}

export async function findPostBySourceUrl(sourceUrl: string, viewerId?: string): Promise<Post | null> {
  const response = await dbAccessorFetch(
    `/posts/source${buildQuery({ sourceUrl, viewerId })}`,
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Impossible de récupérer la publication via son URL source.");
  }

  return expectJson<Post>(response);
}

export async function postExistsBySourceUrl(sourceUrl: string): Promise<boolean> {
  const response = await dbAccessorFetch(`/posts/source/exists${buildQuery({ sourceUrl })}`);

  if (!response.ok) {
    throw new Error("Impossible de vérifier l'existence de la publication.");
  }

  const payload = await expectJson<{ exists: boolean }>(response);
  return Boolean(payload.exists);
}

export async function togglePostLikeByUser(
  id: string,
  userId: string,
): Promise<{ post: Post | null; viewerHasLiked: boolean }> {
  const response = await dbAccessorFetch(`/posts/${encodeURIComponent(id)}/like`, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });

  if (response.status === 404) {
    return { post: null, viewerHasLiked: false };
  }

  if (!response.ok) {
    throw new Error("Impossible de mettre à jour le like de la publication.");
  }

  const post = await expectJson<Post>(response);
  return { post, viewerHasLiked: Boolean(post.viewerHasLiked) };
}

export async function addCommentToPost(
  id: string,
  comment: Comment,
  viewerId?: string,
): Promise<Post | null> {
  const response = await dbAccessorFetch(
    `/posts/${encodeURIComponent(id)}/comments${buildQuery({ viewerId })}`,
    {
      method: "POST",
      body: JSON.stringify({ comment }),
    },
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Impossible d'ajouter le commentaire.");
  }

  return expectJson<Post>(response);
}

export async function addReplyToComment(
  id: string,
  parentId: string,
  reply: CommentReply,
  viewerId?: string,
): Promise<Post | null> {
  const response = await dbAccessorFetch(
    `/posts/${encodeURIComponent(id)}/comments${buildQuery({ viewerId })}`,
    {
      method: "POST",
      body: JSON.stringify({
        reply: {
          ...reply,
          parentId,
        },
      }),
    },
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Impossible d'ajouter la réponse.");
  }

  return expectJson<Post>(response);
}
