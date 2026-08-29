/**
 * Tiny fetch wrapper for the SkillGraph API.
 *
 * All calls go through this one helper so error handling, the base URL and
 * query-string building stay consistent. The backend is reached via the Vite
 * dev proxy at `/api` (see vite.config.ts) or a full URL via `VITE_API_URL`.
 */

export const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

export type QueryParams = Record<string, string | number | readonly string[] | null | undefined>;

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function buildUrl(path: string, params?: QueryParams): string {
  const url = new URL(API_BASE + path, window.location.origin);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === null || value === undefined || value === '') continue;
      if (Array.isArray(value)) {
        for (const item of value) url.searchParams.append(key, String(item));
      } else {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

export async function request<T>(path: string, params?: QueryParams): Promise<T> {
  let response: Response;
  try {
    response = await fetch(buildUrl(path, params));
  } catch {
    throw new ApiError(
      "Can't reach the network right now. Check your connection and try again.",
      0,
    );
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body = (await response.json()) as { message?: string | string[] };
      if (body.message) {
        message = Array.isArray(body.message) ? body.message.join(', ') : body.message;
      }
    } catch {
      // non-JSON error body — keep the generic message
    }
    throw new ApiError(message, response.status);
  }

  return (await response.json()) as T;
}

/** Map any thrown value to a human-facing message. */
export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error && err.message) return err.message;
  return 'Something unexpected went wrong.';
}