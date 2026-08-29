import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { teamSuggestion } from '../api/graph';
import { listSkills } from '../api/skills';
import type { SkillSummary, TeamMemberCandidate } from '../api/types';
import { EmptyState } from '../components/EmptyState';
import { ErrorBanner } from '../components/ErrorBanner';
import { LoadingState } from '../components/LoadingState';
import { PageHeader } from '../components/PageHeader';
import { SkillBadge } from '../components/SkillBadge';
import { avatarColor, initials } from '../lib/format';
import { useFetch } from '../hooks/useFetch';

export function TeamBuilder() {
  const skillsFetch = useFetch(listSkills, []);
  const [selected, setSelected] = useState<string[]>([]);
  const [skillFilter, setSkillFilter] = useState('');

  const suggestionFetch = useFetch(
    () => (selected.length ? teamSuggestion(selected) : Promise.resolve([])),
    [selected],
  );

  const skills = skillsFetch.data ?? [];
  const grouped = useMemo(() => groupByCategory(skills), [skills]);
  const filter = skillFilter.trim().toLowerCase();

  const toggle = (name: string) => {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
  };

  return (
    <div>
      <PageHeader
        kicker="Staffing"
        title="Team Builder"
        description="Choose the skills your project needs and see developers ranked by how much of that set they already cover."
      />

      {/* Skill picker */}
      <section className="card mb-8 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line bg-surface p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <h2 className="text-[16px] font-semibold text-ink">
            Pick required skills
            {selected.length > 0 && (
              <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-[13px] font-semibold tabular-nums text-white">
                {selected.length}
              </span>
            )}
          </h2>
          <div className="relative sm:w-64">
            <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.2-3.2" />
            </svg>
            <input
              type="search"
              className="field py-2 pl-9 text-[14px]"
              placeholder="Filter skills…"
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
            />
          </div>
        </div>

        {/* Selected summary / clear */}
        {selected.length === 0 ? (
          <p className="bg-paper/50 px-5 py-4 text-[14px] text-muted sm:px-6">
            No skills selected yet — click any skill below to add it to the team brief.
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-2 bg-accent-soft/60 px-5 py-3.5 sm:px-6">
            {selected.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => toggle(name)}
                className="group inline-flex items-center gap-1.5 rounded-full border border-accent-line bg-surface px-3 py-1 text-[13px] font-medium text-accent-strong transition-colors hover:border-[#b9432f] hover:text-[#b9432f]"
                title="Remove skill"
              >
                {name}
                <span aria-hidden className="opacity-50 group-hover:opacity-100">
                  ×
                </span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSelected([])}
              className="ml-1 text-[13px] font-medium text-muted hover:text-ink"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Skill groups */}
        <div className="p-5 sm:p-6">
          {skillsFetch.status === 'loading' && (
            <div className="flex flex-wrap gap-2" aria-busy="true">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="skeleton h-8 w-24 rounded-full" />
              ))}
            </div>
          )}

          {skillsFetch.status === 'error' && (
            <ErrorBanner
              message="The skill catalogue couldn’t load — try again."
              onRetry={skillsFetch.refetch}
            />
          )}

          {skillsFetch.status === 'success' && (
            <div className="grid gap-7 lg:grid-cols-2">
              {Object.entries(grouped).map(([category, groupSkills]) => {
                const visible = groupSkills.filter(
                  (s) => !filter || s.name.toLowerCase().includes(filter),
                );
                if (visible.length === 0) return null;
                return (
                  <div key={category || 'General'}>
                    <h3 className="mb-2.5 text-[13px] font-semibold uppercase tracking-wide text-muted">
                      {category || 'General'}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {visible.map((skill) => {
                        const active = selected.includes(skill.name);
                        return (
                          <button
                            key={skill.name}
                            type="button"
                            onClick={() => toggle(skill.name)}
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors ${
                              active
                                ? 'border-accent bg-accent text-white'
                                : 'border-line-strong bg-surface text-ink-soft hover:border-accent hover:text-accent'
                            }`}
                          >
                            {skill.name}
                            <span
                              className={`text-[12px] tabular-nums ${
                                active ? 'opacity-80' : 'text-muted'
                              }`}
                            >
                              {skill.developerCount}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {filter && Object.keys(grouped).every(
                (key) => !grouped[key].some((s) => s.name.toLowerCase().includes(filter)),
              ) && (
                <p className="rounded-lg bg-paper px-3 py-2 text-[13px] text-muted lg:col-span-2">
                  No skills match “{skillFilter.trim()}”.
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Recommendations */}
      {selected.length > 0 && (
        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-[18px] font-semibold text-ink">Candidate developers</h2>
            <p className="text-[13px] text-muted">
              Ranked by how many of your {selected.length} required skills they cover
            </p>
          </div>

          {suggestionFetch.status === 'loading' && (
            <LoadingState rows={3} label="Ranking developers…" />
          )}

          {suggestionFetch.status === 'error' && (
            <ErrorBanner onRetry={suggestionFetch.refetch} />
          )}

          {suggestionFetch.status === 'success' &&
            (suggestionFetch.data!.length === 0 ? (
              <EmptyState
                title="No one covers those skills yet"
                description="The network doesn’t have a developer with any of the skills you picked. Try removing one or two to widen the net."
                action={
                  <button type="button" className="btn-ghost" onClick={() => setSelected([])}>
                    Reset skill selection
                  </button>
                }
              />
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {suggestionFetch.data!.map((candidate) => (
                  <TeamCandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    totalSkills={selected.length}
                  />
                ))}
              </ul>
            ))}
        </section>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------------- */
/* Pieces                                                                     */
/* ------------------------------------------------------------------------- */

function groupByCategory(skills: SkillSummary[]): Record<string, SkillSummary[]> {
  const groups: Record<string, SkillSummary[]> = {};
  for (const skill of [...skills].sort((a, b) => a.name.localeCompare(b.name))) {
    const key = skill.category ?? 'General';
    (groups[key] ??= []).push(skill);
  }
  return groups;
}

function TeamCandidateCard({
  candidate,
  totalSkills,
}: {
  candidate: TeamMemberCandidate;
  totalSkills: number;
}) {
  const color = avatarColor(candidate.name);
  const pct = Math.round((candidate.coverage / totalSkills) * 100);
  const goodFit = pct >= 67;
  const partial = pct >= 34;

  return (
    <li className="card flex flex-col p-5">
      <Link to={`/developers/${candidate.id}`} className="group flex items-center gap-3">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[14px] font-semibold"
          style={{ background: color.bg, color: color.fg }}
          aria-hidden
        >
          {initials(candidate.name)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-semibold text-ink group-hover:text-accent-strong">
            {candidate.name}
          </span>
        </span>
      </Link>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[13px] text-muted">Coverage</span>
          <span className="text-[13px] font-bold tabular-nums text-ink">
            {candidate.coverage}/{totalSkills} · {pct}%
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-paper">
          <div
            className={`h-full rounded-full transition-[width] duration-700 ${
              goodFit
                ? 'bg-accent'
                : partial
                  ? 'bg-gold'
                  : 'bg-[#9aa7b5]'
            }`}
            style={{ width: `${Math.max(pct, 4)}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {candidate.coveredSkills.map((skill) => (
          <SkillBadge key={skill} name={skill} />
        ))}
      </div>
    </li>
  );
}