import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { listDevelopers } from '../api/developers';
import { collaborationPath } from '../api/graph';
import type { CollaborationPath, DeveloperSummary, PathNode } from '../api/types';
import { DeveloperSelect } from '../components/DeveloperSelect';
import { EmptyState } from '../components/EmptyState';
import { ErrorBanner } from '../components/ErrorBanner';
import { PageHeader } from '../components/PageHeader';
import { avatarColor, initials } from '../lib/format';
import { useFetch } from '../hooks/useFetch';

export function PathFinder() {
  const [searchParams] = useSearchParams();
  const prefillFrom = searchParams.get('from');
  const prefillTo = searchParams.get('to');

  const devListFetch = useFetch(() => listDevelopers({ limit: 100 }), []);
  const devs = devListFetch.data?.items ?? [];

  const [from, setFrom] = useState<DeveloperSummary | null>(null);
  const [to, setTo] = useState<DeveloperSummary | null>(null);
  const appliedPrefill = useRef(false);

  useEffect(() => {
    if (appliedPrefill.current || devs.length === 0) return;
    appliedPrefill.current = true;
    const fromDev = prefillFrom ? devs.find((d) => d.id === prefillFrom) ?? null : null;
    const toDev = prefillTo ? devs.find((d) => d.id === prefillTo) ?? null : null;
    setFrom(fromDev);
    setTo(toDev);
    if (fromDev && toDev && fromDev.id !== toDev.id) {
      setRequest({ from: fromDev.id, to: toDev.id });
    }
  }, [devs, prefillFrom, prefillTo]);

  const [request, setRequest] = useState<{ from: string; to: string } | null>(null);
  const sameDev = Boolean(from && to && from.id === to.id);

  const submit = () => {
    if (!from || !to || sameDev) return;
    setRequest({ from: from.id, to: to.id });
  };

  return (
    <div>
      <PageHeader
        kicker="Network"
        title="Collaboration Path Finder"
        description="Pick two developers and see the shortest chain of projects that connects them — the “six degrees” of your network."
      />

      {/* Controls */}
      <section className="card mb-8 p-5 sm:p-6">
        <div className="grid items-end gap-4 md:grid-cols-[1fr_auto_1fr_auto]">
          <DeveloperSelect
            label="From developer"
            value={from}
            onChange={setFrom}
            developers={devs}
            excludeId={to?.id}
            placeholder="Search a developer…"
          />
          <button
            type="button"
            onClick={() => {
              setFrom(to);
              setTo(from);
            }}
            className="hidden h-[42px] w-[42px] items-center justify-center self-end rounded-xl border border-line-strong bg-surface text-muted transition-colors hover:border-accent hover:text-accent md:flex"
            aria-label="Swap developers"
            title="Swap"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M8 3 4 7l4 4" />
              <path d="M4 7h16" />
              <path d="m16 21 4-4-4-4" />
              <path d="M20 17H4" />
            </svg>
          </button>
          <DeveloperSelect
            label="To developer"
            value={to}
            onChange={setTo}
            developers={devs}
            excludeId={from?.id}
            placeholder="Search a developer…"
          />
          <button
            type="button"
            className="btn-primary h-[42px]"
            disabled={!from || !to || sameDev}
            onClick={submit}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="5" cy="6" r="2" />
              <circle cx="19" cy="18" r="2" />
              <path d="M6.5 7.5 17.5 16" />
              <path d="m15 16 2.5 2" />
            </svg>
            Find path
          </button>
        </div>

        {sameDev && (
          <p className="mt-3 text-[13px] font-medium text-[#b9432f]">
            Pick two different developers to trace a path.
          </p>
        )}
        {!from && !to && devListFetch.status === 'error' && (
          <ErrorBanner
            message="Developers couldn’t load — try again to search."
            onRetry={devListFetch.refetch}
          />
        )}
      </section>

      {request && (
        <PathResult key={`${request.from}:${request.to}`} fromId={request.from} toId={request.to} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------------- */
/* Result view                                                                */
/* ------------------------------------------------------------------------- */

function PathResult({ fromId, toId }: { fromId: string; toId: string }) {
  const pathFetch = useFetch(() => collaborationPath(fromId, toId), [fromId, toId]);

  if (pathFetch.status === 'loading') {
    return (
      <div aria-busy="true" className="card p-8">
        <div className="flex items-center justify-center gap-3">
          <div className="skeleton h-16 w-24 rounded-xl" />
          <div className="skeleton h-8 w-8 rounded-full" />
          <div className="skeleton h-16 w-24 rounded-xl" />
          <div className="skeleton h-8 w-8 rounded-full" />
          <div className="skeleton h-16 w-24 rounded-xl" />
        </div>
        <div className="mx-auto mt-6 h-3 w-40">
          <div className="skeleton h-3 w-40 rounded-full" />
        </div>
      </div>
    );
  }

  if (pathFetch.status === 'error') {
    return <ErrorBanner message={pathFetch.error ?? undefined} onRetry={pathFetch.refetch} />;
  }

  const path = pathFetch.data!;

  if (!path.found) {
    return (
      <EmptyState
        title="No connection found"
        description="These two developers aren’t linked through any chain of shared projects within the search depth. They may be in isolated parts of the network — or the names you picked might not match anyone."
        action={
          <Link to="/" className="btn-ghost">
            Browse the network instead
          </Link>
        }
      />
    );
  }

  return <PathChain path={path} />;
}

function PathChain({ path }: { path: CollaborationPath }) {
  const labels = path.nodes.map((node) => node.label);
  const hopCount = Math.max(path.hops, 0);
  const degrees = Math.ceil(hopCount / 2);

  return (
    <div className="card p-6 sm:p-8">
      <div className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-2">
        <h2 className="text-[16px] font-semibold text-ink">Connection found</h2>
        <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[13px] font-semibold tabular-nums text-accent-strong">
          {degrees} degree{degrees === 1 ? '' : 's'} of separation
        </span>
        <span className="text-[13px] text-muted">
          {hopCount} hop{hopCount === 1 ? '' : 's'} across {Math.ceil(hopCount / 2)} shared
          project{hopCount / 2 === 1 ? '' : 's'}
        </span>
      </div>

      <div className="flex items-stretch gap-3 overflow-x-auto pb-3 pt-1">
        {path.nodes.map((node, i) => {
          const isDeveloper = node.label === 'Developer';
          return (
            <div key={`${node.id}-${i}`} className="flex items-center gap-3">
              {isDeveloper ? (
                <DeveloperNode
                  node={node}
                  marker={i === 0 ? 'Start' : i === path.nodes.length - 1 ? 'End' : undefined}
                />
              ) : (
                <ProjectNode node={node} />
              )}
              {i < path.nodes.length - 1 && (
                <Arrow label={edgeLabel(path, i)} />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-4 border-t border-line pt-4 text-[12px] text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-accent" /> Developer
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-gold" /> Shared project
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-px w-4 bg-line-strong" /> {labels.length - 1} connections
        </span>
      </div>
    </div>
  );
}

function edgeLabel(path: CollaborationPath, index: number): string {
  const edge = path.relationships[index];
  if (!edge) return '';
  if (edge.type === 'WORKED_ON') {
    const next = path.nodes[index + 1];
    if (next?.label === 'Developer') return 'with';
    if (next?.label === 'Project') return 'worked on';
  }
  return '—';
}

function DeveloperNode({ node, marker }: { node: PathNode; marker?: string }) {
  const color = avatarColor(node.name);
  return (
    <Link
      to={`/developers/${node.id}`}
      className={`card flex min-w-[150px] flex-col items-center gap-2.5 px-5 py-4 text-center transition-all hover:-translate-y-0.5 hover:shadow-pop ${
        marker ? 'border-accent' : ''
      }`}
    >
      {marker && (
        <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
          {marker}
        </span>
      )}
      <span
        className="flex h-12 w-12 items-center justify-center rounded-full text-[14px] font-semibold"
        style={{ background: color.bg, color: color.fg }}
        aria-hidden
      >
        {initials(node.name)}
      </span>
      <span className="leading-tight">
        <span className="block max-w-[140px] truncate text-[13px] font-semibold text-ink">
          {node.name}
        </span>
        <span className="block text-[11px] uppercase tracking-wide text-muted">
          Developer
        </span>
      </span>
    </Link>
  );
}

function ProjectNode({ node }: { node: PathNode }) {
  return (
    <div className="flex min-w-[150px] flex-col items-center gap-2.5 rounded-card border border-line bg-gold-soft px-5 py-4 text-center shadow-card">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold text-white" aria-hidden>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 20V4a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v16" />
          <path d="M4 8h12" />
          <path d="M4 12h12" />
          <path d="M4 16h12" />
          <path d="M17 8h3a1 1 0 0 1 1 1v8" />
          <path d="M20 18a1.5 1.5 0 1 0 0-3" />
        </svg>
      </span>
      <span className="leading-tight">
        <span className="block max-w-[140px] truncate text-[13px] font-semibold text-ink">
          {node.name}
        </span>
        <span className="block text-[11px] uppercase tracking-wide text-muted">Project</span>
      </span>
    </div>
  );
}

function Arrow({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center self-center px-1">
      <svg width="26" height="16" viewBox="0 0 26 16" fill="none" aria-hidden>
        <path d="M1 8h22M18 3l5 5-5 5" stroke="#846f6f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label && (
        <span className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-muted">
          {label}
        </span>
      )}
    </div>
  );
}