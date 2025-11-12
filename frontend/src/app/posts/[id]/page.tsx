import { notFound } from "next/navigation";

import { PostDetails } from "@/components/post-details";
import { readPostById } from "@/lib/posts";

interface PostPageProps {
  params: {
    id: string;
  };
}

export const dynamic = "force-dynamic";

export default async function PostPage({ params }: PostPageProps) {
  const post = await readPostById(params.id);

  if (!post) {
    notFound();
  }

  return (
    <section className="post-page">
      <PostDetails post={post} />
    </section>
  );
}
