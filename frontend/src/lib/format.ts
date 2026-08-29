/** Hex colour pairs used for developer avatars (bg, fg). */
const AVATAR_COLORS: Array<[string, string]> = [
  ['#0e7a66', '#ffffff'],
  ['#b0711c', '#ffffff'],
  ['#2f5d7a', '#ffffff'],
  ['#7a4d8e', '#ffffff'],
  ['#9c4a2f', '#ffffff'],
  ['#4a7a37', '#ffffff'],
  ['#8a5a3b', '#ffffff'],
  ['#3c6e5f', '#ffffff'],
];

export function initials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function avatarColor(name: string): { bg: string; fg: string } {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  const [bg, fg] = AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  return { bg, fg };
}

export interface ProficiencyLevel {
  key: string;
  label: string;
  range: [number, number];
  dot: string;
  chipBg: string;
  chipFg: string;
}

export const PROFICIENCY_LEVELS: ProficiencyLevel[] = [
  {
    key: 'novice',
    label: 'Novice',
    range: [1, 3],
    dot: '#a8a196',
    chipBg: '#f1ede4',
    chipFg: '#6f675a',
  },
  {
    key: 'intermediate',
    label: 'Intermediate',
    range: [4, 6],
    dot: '#4f7d99',
    chipBg: '#e7eef3',
    chipFg: '#34586e',
  },
  {
    key: 'advanced',
    label: 'Advanced',
    range: [7, 8],
    dot: '#0e7a66',
    chipBg: '#e2f1ec',
    chipFg: '#0a5f50',
  },
  {
    key: 'expert',
    label: 'Expert',
    range: [9, 10],
    dot: '#b0711c',
    chipBg: '#fbf1de',
    chipFg: '#8a5a12',
  },
];

export function proficiencyLevel(value: number | null | undefined): ProficiencyLevel | null {
  if (value == null || Number.isNaN(value)) return null;
  const level = PROFICIENCY_LEVELS.find((l) => value >= l.range[0] && value <= l.range[1]);
  return level ?? PROFICIENCY_LEVELS[0];
}

export function formatYears(years: number | null | undefined): string {
  if (years == null || Number.isNaN(years)) return '';
  return years === 1 ? '1 yr exp' : `${years} yrs exp`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(`${iso.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function formatYearsRange(start: string, end: string): string {
  if (!start && !end) return '';
  if (start && !end) return `${formatDate(start)} — present`;
  if (!start) return formatDate(end);
  return `${formatDate(start)} — ${formatDate(end)}`;
}