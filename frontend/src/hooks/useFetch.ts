import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from '../api/client';

export type FetchStatus = 'loading' | 'success' | 'error';

export interface FetchState<T> {
  data: T | null;
  status: FetchStatus;
  error: string | null;
  rawError: unknown;
  refetch: () => Promise<void>;
}

/**
 * Minimal harness for a promise-producing query. Handles coalescing (stale
 * responses are dropped), loading / error state and manual refetch.
 */
export function useFetch<T>(query: () => Promise<T>, deps: readonly unknown[] = []): FetchState<T> {
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<FetchStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [rawError, setRawError] = useState<unknown>(null);

  const queryRef = useRef(query);
  const runIdRef = useRef(0);

  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  const run = useCallback(async () => {
    const id = ++runIdRef.current;
    setStatus((prev) => (prev === 'error' ? prev : 'loading'));
    setError(null);
    setRawError(null);
    try {
      const result = await queryRef.current();
      if (id !== runIdRef.current) return;
      setData(result);
      setStatus('success');
    } catch (err) {
      if (id !== runIdRef.current) return;
      setError(errorMessage(err));
      setRawError(err);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, status, error, rawError, refetch: run };
}