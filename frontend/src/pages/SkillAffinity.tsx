import { useState } from 'react';
import { skillAffinity } from '../api/graph';
import { EmptyState } from '../components/EmptyState';
import { ErrorBanner } from '../components/ErrorBanner';
import { PageHeader } from '../components/PageHeader';
import { useFetch } from '../hooks/useFetch';

const LIMIT_OPTIONS = [10, 15, 20] as const;

export function SkillAffinity() {
  const [limit, setLimit] = useState<number>(10);
  const affinityFetch = useFetch(() => skillAffinity({ limit }), [limit]);

  return (
    <div>
      <PageHeader
        kicker="Insights"
        title="Skill Affinity"
        description="Which skills tend to travel together? Every bar counts how often a skill pair shows up on the same project across the network."
      >
        <div className="flex items-center gap-1 rounded-xl border border-line bg-surface p-1">
          {LIMIT_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setLimit(option)}
              className={`rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                limit === option
                  ? 'bg-accent text-white'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              Top {option}
            </button>
          ))}
        </div>
      </PageHeader>

      {affinityFetch.status === 'loading' && (
        <div className="card p-6 sm:p-8" aria-busy="true">
          <div className="space-y-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="skeleton h-4 w-40 rounded" />
                  <div className="skeleton h-4 w-8 rounded" />
                </div>
                <div className="skeleton h-4 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      )}

      {affinityFetch.status === 'error' && (
        <ErrorBanner onRetry={affinityFetch.refetch} />
      )}

      {affinityFetch.status === 'success' && (
        <>
          {affinityFetch.data!.length === 0 ? (
            <EmptyState
              title="No skill pairs to show yet"
              description="Once projects use two or more skills together, the strongest combinations will appear here."
            />
          ) : (
            <AffinityChart pairs={affinityFetch.data!} />
          )}
        </>
      )}
    </div>
  );
}

function AffinityChart({ pairs }: { pairs: Array<{ skillA: string; skillB: string; coOccurrences: number }> }) {
  const max = Math.max(...pairs.map((p) => p.coOccurrences), 1);

  return (
    <div className="card p-6 sm:p-8">
      <ul className="space-y-5">
        {pairs.map((pair) => {
          const pct = Math.max((pair.coOccurrences / max) * 100, 4);
          return (
            <li key={`${pair.skillA}+${pair.skillB}`}>
              <div className="mb-1.5 flex items-baseline justify-between gap-4">
                <span className="text-[14px] font-medium text-ink">
                  <strong className="font-semibold">{pair.skillA}</strong>
                  <span className="mx-2 text-muted">+</span>
                  <strong className="font-semibold">{pair.skillB}</strong>
                </span>
                <span className="text-[15px] font-bold tabular-nums text-accent-strong">
                  {pair.coOccurrences}
                  <span className="ml-1 text-[12px] font-medium text-muted">
                    project{pair.coOccurrences === 1 ? '' : 's'}
                  </span>
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-paper">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent to-[#3b9c87] transition-[width] duration-700 ease-out"
                  style={{ width: `${pct}%` }}
                  role="img"
                  aria-label={`${pair.skillA} and ${pair.skillB} co-occur in ${pair.coOccurrences} projects`}
                />
              </div>
            </li>
          );
        })}
      </ul>

      <p className="mt-8 border-t border-line pt-4 text-[13px] leading-relaxed text-muted">
        Co-occurrence is measured per project: a pair counts once for every project whose
        stacked skill set includes both skills. It’s a useful signal for spotting
        technologies that tend to ship together.
      </p>
    </div>
  );
}