import { Link } from 'react-router-dom';
import type { DeveloperSummary } from '../api/types';
import { avatarColor, formatYears, initials } from '../lib/format';

type DeveloperCardProps = {
  developer: DeveloperSummary;
  footer?: {
    label: string;
    value: string | number;
    accent?: boolean;
    secondary?: string;
  };
};

export function DeveloperCard({ developer, footer }: DeveloperCardProps) {
  const color = avatarColor(developer.name);

  return (
    <Link
      to={`/developers/${developer.id}`}
      className="card group relative block overflow-hidden p-5 transition-all hover:-translate-y-0.5 hover:border-accent-line hover:shadow-pop"
    >
      <div className="flex items-start gap-4">
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[15px] font-semibold tracking-wide"
          style={{ background: color.bg, color: color.fg }}
          aria-hidden
        >
          {initials(developer.name)}
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-[16px] font-semibold text-ink group-hover:text-accent-strong">
            {developer.name}
          </h3>
          <p className="truncate text-[14px] text-muted">
            {developer.title ?? 'Developer'}
          </p>
          <div className="mt-1 flex items-center gap-2 text-[13px] text-muted">
            {developer.location && <span>{developer.location}</span>}
            {developer.location && developer.yearsExperience != null && (
              <span aria-hidden>·</span>
            )}
            {developer.yearsExperience != null && (
              <span>{formatYears(developer.yearsExperience)}</span>
            )}
          </div>
        </div>
      </div>

      {footer && (
        <div
          className={`mt-4 flex items-baseline justify-between rounded-lg px-3 py-2 ${
            footer.accent ? 'bg-accent-soft text-accent-strong' : 'bg-paper/70'
          }`}
        >
          <span className="text-[13px] font-medium">{footer.label}</span>
          <span className="text-[15px] font-bold tabular-nums">
            {footer.value}
            {footer.secondary && (
              <span className="ml-1 text-[12px] font-medium opacity-70">
                {footer.secondary}
              </span>
            )}
          </span>
        </div>
      )}

      <span
        aria-hidden
        className="absolute right-3 top-3 text-line-strong opacity-0 transition-opacity group-hover:opacity-100"
      >
        →
      </span>
    </Link>
  );
}