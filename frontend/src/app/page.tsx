import { Suspense } from "react";
import { Feed } from "@/components/feed";
import { FeedSkeleton } from "@/components/feed-skeleton";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <section>
      <header className="page-header">
        <h1>Fil d'actualité</h1>
        <p>
          Retrouvez les derniers rapports publiés. Chaque carte correspond à un
          rapport vérifié et résumé.
        </p>
      </header>
      <Suspense fallback={<FeedSkeleton />}>
        <Feed />
      </Suspense>
    </section>
  );
}
