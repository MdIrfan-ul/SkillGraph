import type { ProficiencyLevel } from '../lib/format';
import { proficiencyLevel } from '../lib/format';

interface SkillBadgeProps {
  name: string;
  proficiency?: string | number | null;
  size?: 'sm' | 'md';
}

export function SkillBadge({ name, proficiency, size = 'sm' }: SkillBadgeProps) {
  const numeric = proficiency != null ? Number(proficiency) : Number.NaN;
  const level: ProficiencyLevel | null = proficiencyLevel(numeric);

  if (level) {
    const padding = size === 'md' ? 'px-3 py-1.5' : 'px-2.5 py-1';
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-medium ${padding} text-[13px]`}
        style={{ background: level.chipBg, color: level.chipFg }}
        title={`${name} — ${level.label}`}
      >
        <span
          aria-hidden
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: level.dot }}
        />
        {name}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full border border-line bg-paper/60 px-2.5 py-1 text-[13px] font-medium text-ink-soft">
      {name}
    </span>
  );
}