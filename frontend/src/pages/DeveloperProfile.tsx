import { Link, useParams } from 'react-router-dom';
import { ApiError } from '../api/client';
import { getDeveloper } from '../api/developers';
import { sharedSkills } from '../api/graph';
import { DeveloperCard } from '../components/DeveloperCard';
import { EmptyState, BrowseAction } from '../components/EmptyState';
import { ErrorBanner } from '../components/ErrorBanner';
import { LoadingState } from '../components/LoadingState';
import type { DeveloperProject, DeveloperSkill, SimilarDeveloper } from '../api/types';
import {
  avatarColor,
  formatYears,
  formatYearsRange,
  initials,
  proficiencyLevel,
} from '../lib/format';
import { useFetch } from '../hooks/useFetch';

export function DeveloperProfile() {
  const { id = '' } = useParams();

  const profileFetch = useFetch(() => getDeveloper(id), [id]);
  const suggestionsFetch = useFetch(() => sharedSkills(id, 2), [id]);

  if (profileFetch.status === 'loading') {
    return <LoadingState variant="profile" label="Loading profile…" />;
  }

  if (profileFetch.status === 'error') {
    const is404 = profileFetch.rawError instanceof ApiError && profileFetch.rawError.status === 404;
    if (is404) {
      return (
        <EmptyState
          title="This developer isn’t in the network"
          description="The profile you’re looking for doesn’t exist or may have been removed."
          action={<BrowseAction />}
        />
      );
    }
    return <ErrorBanner message={profileFetch.error ?? undefined} onRetry={profileFetch.refetch} />;
  }

  const dev = profileFetch.data!;
  const color = avatarColor(dev.name);
  const suggestions = suggestionsFetch.data ?? [];

  const sortedSkills = [...dev.skills].sort(
    (a, b) => Number(b.proficiency) - Number(a.proficiency) || a.name.localeCompare(b.name),
  );
  const sortedProjects = [...dev.projects].sort(
    (a, b) => b.startDate.localeCompare(a.startDate) || a.name.localeCompare(b.name),
  );

  return (
    <div>
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-1.5 text-[14px] font-medium text-accent hover:underline"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m15 18-6-6 6-6" />
        </svg>
        Back to search
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          {/* Profile header */}
          <section className="card p-6 sm:p-7">
            <div className="flex flex-wrap items-start gap-5">
              <span
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-[20px] font-semibold tracking-wide"
                style={{ background: color.bg, color: color.fg }}
                aria-hidden
              >
                {initials(dev.name)}
              </span>
              <div className="min-w-0 flex-1">
                <h1 className="text-[22px] font-bold tracking-tight text-ink sm:text-[26px]">
                  {dev.name}
                </h1>
                <p className="mt-0.5 text-[15px] text-ink-soft">{dev.title ?? 'Developer'}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted">
                  {dev.location && <span>{dev.location}</span>}
                  {dev.location && dev.yearsExperience != null && <span aria-hidden>·</span>}
                  {dev.yearsExperience != null && <span>{formatYears(dev.yearsExperience)}</span>}
                </div>
              </div>
            </div>
            {dev.bio && (
              <p className="mt-5 border-t border-line pt-5 text-[15px] leading-relaxed text-ink-soft">
                {dev.bio}
              </p>
            )}
          </section>

          {/* Skills */}
          <section className="card p-6 sm:p-7">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[16px] font-semibold text-ink">Skills</h2>
              {dev.skills.length > 0 && (
                <span className="text-[13px] tabular-nums text-muted">{dev.skills.length} total</span>
              )}
            </div>
            {sortedSkills.length === 0 ? (
              <p className="text-[14px] text-muted">No skills listed for this developer yet.</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {sortedSkills.map((skill) => (
                  <SkillTile key={skill.name} skill={skill} />
                ))}
              </ul>
            )}
          </section>

          {/* Projects */}
          <section className="card p-6 sm:p-7">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[16px] font-semibold text-ink">Projects</h2>
              {sortedProjects.length > 0 && (
                <span className="text-[13px] tabular-nums text-muted">
                  {sortedProjects.length} total
                </span>
              )}
            </div>
            {sortedProjects.length === 0 ? (
              <p className="text-[14px] text-muted">
                This developer hasn’t been attached to any projects yet.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {sortedProjects.map((project) => (
                  <ProjectTile key={project.name + project.role} project={project} />
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {suggestionsFetch.status === 'error' ? (
            <ErrorBanner
              message="Suggested collaborators couldn’t load."
              onRetry={suggestionsFetch.refetch}
            />
          ) : (
            <SuggestionsPanel
              developerId={dev.id}
              suggestions={suggestions}
              loading={suggestionsFetch.status === 'loading'}
            />
          )}
        </aside>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------- */
/* Small presentational pieces                                               */
/* ------------------------------------------------------------------------- */

function SkillTile({ skill }: { skill: DeveloperSkill }) {
  const numeric = Number(skill.proficiency);
  const level = proficiencyLevel(numeric);
  const color = avatarColor(skill.name);

  return (
    <li className="card flex items-center gap-3 px-3 py-2.5">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[13px] font-semibold"
        style={{ background: color.bg, color: color.fg }}
        aria-hidden
      >
        {initials(skill.name)}
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-semibold text-ink">{skill.name}</span>
          {level && (
            <span
              className="rounded-full px-1.5 py-px text-[11px] font-semibold uppercase tracking-wide"
              style={{ background: level.chipBg, color: level.chipFg }}
            >
              {level.label}
            </span>
          )}
        </div>
        <p className="text-[12px] text-muted">
          {level ? `Proficiency ${skill.proficiency}/10` : 'Proficiency unknown'}
          {skill.yearsUsed != null && ` · ${skill.yearsUsed} yr${skill.yearsUsed === 1 ? '' : 's'}`}
        </p>
      </div>
    </li>
  );
}

function ProjectTile({ project }: { project: DeveloperProject }) {
  const range = formatYearsRange(project.startDate, project.endDate);
  return (
    <li className="flex items-start justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-[15px] font-semibold text-ink">{project.name}</p>
        <p className="mt-0.5 text-[13px] text-muted">
          {project.role ? `${project.role} · ` : ''}
          {project.company || 'Independent'}
        </p>
      </div>
      {range && (
        <span className="shrink-0 rounded-md bg-paper px-2 py-1 text-[12px] font-medium tabular-nums text-ink-soft">
          {range}
        </span>
      )}
    </li>
  );
}

function SuggestionsPanel({
  developerId,
  suggestions,
  loading,
}: {
  developerId: string;
  suggestions: SimilarDeveloper[];
  loading: boolean;
}) {
  return (
    <section className="card p-6">
      <div className="mb-1 flex items-center gap-2">
        <h2 className="text-[16px] font-semibold text-ink">Suggested collaborators</h2>
      </div>
      <p className="mb-4 text-[13px] leading-relaxed text-muted">
        Developers who share skills but haven’t worked together yet — a good place to spark
        a connection.
      </p>

      {loading && (
        <div className="space-y-3" aria-busy="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="skeleton h-9 w-9 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <div className="skeleton h-3.5 w-2/3 rounded" />
                <div className="skeleton h-3 w-1/3 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && suggestions.length === 0 && (
        <p className="rounded-lg bg-paper/70 px-3 py-3 text-[13px] leading-relaxed text-muted">
          No nearby collaborators found right now. Try exploring the network to find
          potential partners.
        </p>
      )}

      {!loading && suggestions.length > 0 && (
        <ul className="space-y-3">
          {suggestions.slice(0, 5).map((s) => (
            <li key={s.id}>
              <DeveloperCard
                developer={{
                  id: s.id,
                  name: s.name,
                  title: s.title,
                  location: s.location,
                  yearsExperience: null,
                }}
                footer={{
                  label: 'Shared skills',
                  value: s.sharedSkills,
                  accent: true,
                }}
              />
            </li>
          ))}
        </ul>
      )}

      <Link
        to={`/path-finder?from=${encodeURIComponent(developerId)}`}
        className="mt-5 block w-full text-center"
      >
        <span className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-accent hover:underline">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="5" cy="6" r="2" />
            <circle cx="19" cy="18" r="2" />
            <path d="M6.5 7.5 17.5 16" />
            <path d="m15 16 2.5 2" />
          </svg>
          See who they connect to
        </span>
      </Link>
    </section>
  );
}