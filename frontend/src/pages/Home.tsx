import { useMemo, useState } from 'react';
import { DeveloperCard } from '../components/DeveloperCard';
import { EmptyState } from '../components/EmptyState';
import { ErrorBanner } from '../components/ErrorBanner';
import { LoadingState } from '../components/LoadingState';
import { PageHeader } from '../components/PageHeader';
import { listDevelopers } from '../api/developers';
import { listSkills } from '../api/skills';
import { useFetch } from '../hooks/useFetch';

const SKILL_CHIP_LIMIT = 16;

export function Home() {
  const [nameQuery, setNameQuery] = useState('');
  const [activeSkill, setActiveSkill] = useState<string | null>(null);

  const skillsFetch = useFetch(listSkills, []);
  const developersFetch = useFetch(
    () => listDevelopers({ limit: 100, skill: activeSkill ?? undefined }),
    [activeSkill],
  );

  const allSkills = skillsFetch.data ?? [];
  const rankedSkills = useMemo(
    () =>
      [...allSkills]
        .sort((a, b) => b.developerCount - a.developerCount || a.name.localeCompare(b.name))
        .slice(0, SKILL_CHIP_LIMIT),
    [allSkills],
  );

  const developers = developersFetch.data?.items ?? [];
  const filtered = useMemo(
    () =>
      developers.filter((d) =>
        d.name.toLowerCase().includes(nameQuery.trim().toLowerCase()),
      ),
    [developers, nameQuery],
  );

  const showingAll = !nameQuery.trim() && !activeSkill;

  return (
    <div>
      <PageHeader
        kicker="Home"
        title="Find your next teammate"
        description="Search developers by name — or browse the network by the skills that matter."
      />

      {/* Search panel */}
      <section className="card mb-8 overflow-hidden">
        <div className="border-b border-line bg-surface p-5 sm:p-6">
          <label htmlFor="dev-search" className="mb-2 block text-[13px] font-semibold text-ink-soft">
            Search by name
          </label>
          <div className="relative">
            <svg
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.2-3.2" />
            </svg>
            <input
              id="dev-search"
              type="search"
              className="field pl-11"
              placeholder="Try typing a developer's name…"
              value={nameQuery}
              onChange={(e) => setNameQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-paper/50 p-5 sm:p-6">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[13px] font-semibold text-ink-soft">Browse by skill</p>
            {activeSkill && (
              <button
                type="button"
                onClick={() => setActiveSkill(null)}
                className="text-[13px] font-medium text-accent hover:underline"
              >
                Clear skill filter
              </button>
            )}
          </div>

          {skillsFetch.status === 'loading' && (
            <div className="flex h-8 items-center">
              <div className="skeleton h-6 w-40 rounded-full" />
            </div>
          )}

          {skillsFetch.status === 'error' && (
            <p className="rounded-lg bg-[#fbeae6] px-3 py-2 text-[13px] text-[#a33b29]">
              Skill suggestions couldn’t load — search by name still works.
            </p>
          )}

          {skillsFetch.status === 'success' && (
            <div className="flex flex-wrap gap-2">
              {rankedSkills.map((skill) => {
                const active = skill.name === activeSkill;
                return (
                  <button
                    key={skill.name}
                    type="button"
                    onClick={() => setActiveSkill(active ? null : skill.name)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors ${
                      active
                        ? 'border-accent bg-accent text-white'
                        : 'border-line-strong bg-surface text-ink-soft hover:border-accent hover:text-accent'
                    }`}
                  >
                    {skill.name}
                    <span className={`text-[12px] tabular-nums ${active ? 'opacity-80' : 'text-muted'}`}>
                      {skill.developerCount}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Results */}
      {developersFetch.status === 'loading' && (
        <LoadingState rows={6} label="Loading developers…" />
      )}

      {developersFetch.status === 'error' && (
        <ErrorBanner onRetry={developersFetch.refetch} />
      )}

      {developersFetch.status === 'success' && (
        <>
          {filtered.length === 0 ? (
            <EmptyState
              title={
                showingAll
                  ? 'No developers in the network yet'
                  : 'No developers match that search'
              }
              description={
                showingAll
                  ? 'The network looks empty right now. Check back once developers have joined.'
                  : 'Try a different name, clear the skill filter, or just browse everyone in the network.'
              }
              action={
                !showingAll ? (
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => {
                      setNameQuery('');
                      setActiveSkill(null);
                    }}
                  >
                    Show all developers
                  </button>
                ) : undefined
              }
            />
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-[14px] text-muted">
                  {filtered.length} developer{filtered.length === 1 ? '' : 's'}
                  {activeSkill && (
                    <>
                      {' '}
                      with <span className="font-semibold text-ink-soft">{activeSkill}</span>
                    </>
                  )}
                  {!activeSkill && nameQuery.trim() && (
                    <>
                      {' '}
                      matching “<span className="font-semibold text-ink-soft">{nameQuery.trim()}</span>”
                    </>
                  )}
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((dev) => (
                  <DeveloperCard key={dev.id} developer={dev} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}