# SkillGraph Frontend

React + Vite + TypeScript UI for exploring the developer / skill / project graph.
Talks to the NestJS API (see [`../backend`](../backend)) over plain `fetch`.

## Run it

```bash
cd backend && npm run start:prod   # or: npm run start:dev   (serves API on :3000)
cd frontend && npm install && npm run dev   # serves UI on :5173, proxies /api → :3000
```

In production, point `VITE_API_URL` at the API (e.g. `https://api.example.com`)
before building:

```bash
npm run build   # typechecks (tsc -b) then bundles to dist/
npm run preview
```

## Pages

| Route                | Purpose                                                    |
| -------------------- | ---------------------------------------------------------- |
| `/`                  | Search developers by name, browse by skill                 |
| `/developers/:id`    | Profile: skills, projects, suggested collaborators         |
| `/path-finder`       | Shortest collaboration path between two developers         |
| `/affinity`          | Top co-occurring skill pairs (bar chart)                   |
| `/team-builder`      | Pick required skills → developers ranked by coverage       |

## Layout

```
src/
  api/            # typed fetch wrappers per resource + shared client
  hooks/          # useFetch (loading/error/coalescing)
  components/     # DeveloperCard, SkillBadge, DeveloperSelect, Loading/Empty/Error, Layout
  pages/          # the five views
  lib/            # formatting + proficiency/avatar helpers
  App.tsx         # routing
```

## Design notes

- **Data/state discipline:** every page renders explicit **loading** (skeleton, never
  a blank flash), **empty** (a friendly message + suggested next step) and
  **error** (banner with the "can't reach the database" message and a Retry
  button) states via a shared `useFetch` hook.
- **Tokens:** warm paper background, deep-teal accent, off-black ink, 16px base,
  `Inter Variable` font bundled locally via `@fontsource`. No pure black/white.
- **Proficiency badges** map the 1–10 scale to Novice / Intermediate / Advanced /
  Expert with four colour-coded levels.
- **No graph-rendering library:** the path finder renders a flexbox "chain" of
  developer / project cards; the affinity chart is pure CSS bars.

### Screenshots for the README

Capture all major states (loaded / loading / empty / error) with the local
Chrome via puppeteer-core — backend on :3000, dev server on :5173:

```bash
cd frontend && node scripts/screenshot.mjs         # all states
node scripts/screenshot.mjs loaded                 # loaded + empty
node scripts/screenshot.mjs loading                # skeletons
node scripts/screenshot.mjs error                  # unreachable-backend banner
```

Output lands in `../docs/screenshots/`.