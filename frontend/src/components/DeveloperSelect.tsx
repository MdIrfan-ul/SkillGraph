import { useEffect, useMemo, useRef, useState } from 'react';
import type { DeveloperSummary } from '../api/types';
import { listDevelopers } from '../api/developers';
import { errorMessage } from '../api/client';
import { avatarColor, initials } from '../lib/format';

interface DeveloperSelectProps {
  value: DeveloperSummary | null;
  onChange: (dev: DeveloperSummary | null) => void;
  placeholder?: string;
  label?: string;
  excludeId?: string;
  /** Preloaded developer list — skips an internal fetch when provided. */
  developers?: DeveloperSummary[];
}

const RESULT_LIMIT = 30;

/**
 * Searchable developer picker with a combobox-style dropdown. Loads the full
 * network once and filters on the client so typing feels instant.
 */
export function DeveloperSelect({
  value,
  onChange,
  placeholder = 'Type to search developers…',
  label,
  excludeId,
  developers,
}: DeveloperSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [all, setAll] = useState<DeveloperSummary[]>([]);
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (developers) {
      setAll(developers);
      setStatus('ready');
    } else {
      let cancelled = false;
      setStatus('loading');
      listDevelopers({ limit: 100 })
        .then((res) => {
          if (cancelled) return;
          setAll(res.items);
          setStatus('ready');
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          setStatus('error');
          setErrorMsg(errorMessage(err));
        });
      return () => {
        cancelled = true;
      };
    }
  }, [developers]);

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = all.filter(
      (d) => d.id !== excludeId && d.name.toLowerCase().includes(q),
    );
    if (!q) return matches.slice(0, RESULT_LIMIT);
    return matches
      .sort((a, b) => {
        const aStarts = a.name.toLowerCase().startsWith(q) ? 0 : 1;
        const bStarts = b.name.toLowerCase().startsWith(q) ? 0 : 1;
        return aStarts - bStarts || a.name.localeCompare(b.name);
      })
      .slice(0, RESULT_LIMIT);
  }, [all, query, excludeId]);

  const select = (dev: DeveloperSummary) => {
    onChange(dev);
    setQuery(dev.name);
    setOpen(false);
  };

  const clear = () => {
    onChange(null);
    setQuery('');
    setOpen(true);
  };

  const displayValue = query !== '' || !value ? query : value.name;

  return (
    <div ref={rootRef} className="relative">
      {label && (
        <label className="mb-1.5 block text-[13px] font-semibold text-ink-soft">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          className="field pr-10"
          placeholder={placeholder}
          value={displayValue}
          onChange={(e) => {
            setQuery(e.target.value);
            if (value && e.target.value !== value.name) onChange(null);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const first = results[0];
              if (first) select(first);
            }
          }}
        />
        <button
          type="button"
          onClick={() => (value ? clear() : setOpen((o) => !o))}
          className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted transition-colors hover:bg-paper hover:text-ink"
          aria-label={value ? 'Clear selection' : 'Toggle list'}
        >
          {value ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="m6 9 6 6 6-6" />
            </svg>
          )}
        </button>
      </div>

      {open && status === 'ready' && (
        <div className="card absolute z-30 mt-2 max-h-80 w-full overflow-y-auto p-1.5 shadow-pop">
          {results.length === 0 ? (
            <p className="px-3 py-4 text-center text-[14px] text-muted">
              No developers match “{query.trim()}”.
            </p>
          ) : (
            <ul role="listbox" className="space-y-0.5">
              {results.map((dev) => {
                const color = avatarColor(dev.name);

                return (
                  <li key={dev.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={value?.id === dev.id}
                      onClick={() => select(dev)}
                      className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-accent-soft"
                    >
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold"
                        style={{ background: color.bg, color: color.fg }}
                      >
                        {initials(dev.name)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[14px] font-medium text-ink">
                          {dev.name}
                        </span>
                        <span className="block truncate text-[13px] text-muted">
                          {dev.title ?? 'Developer'}
                          {dev.location ? ` · ${dev.location}` : ''}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {open && status === 'loading' && (
        <div className="card absolute z-30 mt-2 w-full p-3 shadow-pop">
          <div className="skeleton h-9 w-full rounded-lg" />
        </div>
      )}

      {status === 'error' && (
        <p className="mt-1.5 text-[13px] text-[#b9432f]">
          Couldn’t load developers: {errorMsg}
        </p>
      )}
    </div>
  );
}