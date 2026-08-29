/** Safely converts neo4j Integer / Float / primitive / null to a JS number. */
export function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'bigint') return Number(value);
  const maybe = value as { toNumber?: () => number };
  if (typeof maybe.toNumber === 'function') {
    try {
      return maybe.toNumber();
    } catch {
      return Number(String(value));
    }
  }
  return Number(value);
}