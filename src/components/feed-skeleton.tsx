export function FeedSkeleton() {
  return (
    <div className="feed">
      {Array.from({ length: 3 }).map((_, index) => (
        <div className="post-card" key={index} aria-hidden>
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-body" />
          <div className="skeleton skeleton-body" />
        </div>
      ))}
    </div>
  );
}
