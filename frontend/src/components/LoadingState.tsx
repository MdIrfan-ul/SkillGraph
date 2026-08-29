interface LoadingStateProps {
  label?: string;
  rows?: number;
  variant?: 'cards' | 'list' | 'profile';
}

/** Skeletons instead of a blank flash while data loads. */
export function LoadingState({ label = 'Loading…', rows = 3, variant = 'cards' }: LoadingStateProps) {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <p className="sr-only">{label}</p>

      {variant === 'cards' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="card p-5 space-y-3">
              <div className="flex items-center gap-4">
                <div className="skeleton h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-3/4 rounded" />
                  <div className="skeleton h-3 w-1/2 rounded" />
                </div>
              </div>
              <div className="skeleton h-10 w-full rounded-lg" />
            </div>
          ))}
        </div>
      )}

      {variant === 'list' && (
        <div className="card divide-y divide-line overflow-hidden">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <div className="skeleton h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-1/3 rounded" />
                <div className="skeleton h-3 w-1/4 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {variant === 'profile' && (
        <div className="space-y-6">
          <div className="card p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="skeleton h-16 w-16 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-5 w-1/3 rounded" />
                <div className="skeleton h-3 w-1/4 rounded" />
              </div>
            </div>
            <div className="skeleton h-3 w-full rounded" />
            <div className="skeleton h-3 w-2/3 rounded" />
          </div>
          <div className="card p-6">
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton h-7 w-24 rounded-full" />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}