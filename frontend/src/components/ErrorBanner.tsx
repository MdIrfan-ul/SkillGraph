interface ErrorBannerProps {
  message?: string;
  onRetry?: () => void;
}

const DEFAULT_MESSAGE =
  "Can't reach the database right now. Try again shortly.";

/**
 * Full-width alert shown when a backend call fails. Includes an optional
 * retry action so the user isn't stuck.
 */
export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="card flex flex-col gap-4 border-l-4 border-l-[#b9432f] bg-surface p-5 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fbeae6] text-[#b9432f]">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M12 4 3 20h18L12 4Z" />
            <path d="M12 10v4" />
            <path d="M12 17.5h.01" />
          </svg>
        </span>
        <div>
          <p className="text-[15px] font-semibold text-ink">Something went wrong</p>
          <p className="mt-0.5 text-[14px] text-ink-soft">
            {message ?? DEFAULT_MESSAGE}
          </p>
        </div>
      </div>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-primary shrink-0">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M21 12a9 9 0 1 1-2.6-6.4" />
            <path d="M21 3v6h-6" />
          </svg>
          Try again
        </button>
      )}
    </div>
  );
}