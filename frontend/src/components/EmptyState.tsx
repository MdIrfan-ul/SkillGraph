import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  variant?: 'default' | 'compact';
}

/** A friendly "nothing here yet" block with a suggested next step. */
export function EmptyState({ title, description, action, variant = 'default' }: EmptyStateProps) {
  return (
    <div
      className={`card flex flex-col items-center justify-center text-center ${
        variant === 'compact' ? 'px-6 py-10' : 'px-8 py-16'
      }`}
    >
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          aria-hidden
        >
          <circle cx="6" cy="6" r="3" />
          <circle cx="18" cy="5" r="2.4" />
          <circle cx="16" cy="18" r="3" />
          <path d="M8.6 7.9 14.6 15M7.2 8.6 5.2 15.2M16 9.6 16.4 15.4" />
        </svg>
      </div>
      <h3 className="text-[18px] font-semibold text-ink">{title}</h3>
      {description && (
        <p className="mt-2 max-w-md text-[15px] leading-relaxed text-muted">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function BrowseAction() {
  return (
    <Link to="/" className="btn-ghost">
      Browse developers
    </Link>
  );
}