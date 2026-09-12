export function ListingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid" aria-label="Loading properties" aria-busy="true">
      {Array.from({ length: count }).map((_, index) => (
        <div className="card skeleton-card" key={index}>
          <div className="skeleton skeleton-image" />
          <div className="card-body">
            <div className="skeleton skeleton-line wide" />
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-line short" />
            <div className="skeleton skeleton-button" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminSkeleton() {
  return (
    <div className="admin-grid" aria-label="Loading admin dashboard" aria-busy="true">
      <div className="panel">
        <div className="skeleton skeleton-line wide" />
        <div className="skeleton-stack">
          {Array.from({ length: 5 }).map((_, index) => (
            <div className="skeleton skeleton-row" key={index} />
          ))}
        </div>
      </div>
      <div className="panel">
        <div className="skeleton skeleton-line wide" />
        <div className="skeleton-stack">
          {Array.from({ length: 8 }).map((_, index) => (
            <div className="skeleton skeleton-line" key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
