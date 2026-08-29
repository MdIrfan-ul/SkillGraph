import { NavLink, Outlet } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', label: 'Search', end: true },
  { to: '/path-finder', label: 'Path Finder' },
  { to: '/affinity', label: 'Skill Affinity' },
  { to: '/team-builder', label: 'Team Builder' },
];

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-line bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <NavLink to="/" className="flex items-center gap-2.5" aria-label="SkillGraph home">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="5" cy="6" r="2" fill="currentColor" />
                <circle cx="19" cy="5" r="2" fill="currentColor" />
                <circle cx="16.5" cy="18.5" r="2" fill="currentColor" />
                <circle cx="5" cy="18.5" r="2" fill="currentColor" />
                <path d="M6.8 7.5 14 16.8M5 8.3 6.4 16.4M15.4 6.7 16.9 16.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </span>
            <span className="text-[17px] font-semibold tracking-tight text-ink">
              Skill<span className="text-accent">Graph</span>
            </span>
          </NavLink>

          <nav className="flex items-center gap-1" aria-label="Main">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 text-[14px] font-medium transition-colors ${
                    isActive
                      ? 'bg-accent-soft text-accent-strong'
                      : 'text-ink-soft hover:bg-surface hover:text-ink'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <Outlet />
      </main>

      <footer className="border-t border-line py-6">
        <p className="mx-auto max-w-6xl px-4 text-[13px] text-muted sm:px-6">
          SkillGraph — exploring the developer, skill &amp; project graph.
        </p>
      </footer>
    </div>
  );
}