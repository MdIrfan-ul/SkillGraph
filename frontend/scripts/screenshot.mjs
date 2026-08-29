/**
 * Captures SkillGraph UI screenshots for the README by driving the locally
 * installed Chrome via puppeteer-core. Requires:
 *   - the backend running on :3000 (or a mocked/unreachable one for error shots)
 *   - `npm run dev` running on :5173
 *
 * Usage:  node scripts/screenshot.mjs  [subset]
 * Subset: all (default) | loaded | empty | loading | error
 */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import puppeteer from 'puppeteer-core';

const OUT_DIR = fileURLToPath(new URL('../../docs/screenshots/', import.meta.url));

const CHROME_CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
];
const CHROME_PATH = existsSync('scripts/chrome-path.txt')
  ? readFileSync('scripts/chrome-path.txt', 'utf8').trim()
  : (CHROME_CANDIDATES.find((p) => existsSync(p)) ?? null);

if (!CHROME_PATH) {
  console.error('No Chrome/Edge found. Set scripts/chrome-path.txt to your browser path.');
  process.exit(1);
}

const BASE = 'http://localhost:5173';
const VIEWPORT = { width: 1440, height: 900 };
const shot = (page, name) =>
  page.screenshot({ path: join(OUT_DIR, name), fullPage: true });

const browser = await puppeteer.launch({
  executablePath: CHROME_PATH,
  headless: 'new',
  defaultViewport: VIEWPORT,
  args: ['--hide-scrollbars', '--no-sandbox'],
});

/** Runs `fn`, adding a ~2.5s artificial delay to API responses so skeletons are visible. */
async function slowApi(page, fn) {
  await page.setRequestInterception(true);
  const onRequest = (req) => {
    if (req.url().startsWith(`${BASE}/api`)) {
      setTimeout(() => req.continue(), 2500);
      return;
    }
    req.continue();
  };
  page.on('request', onRequest);
  try {
    await fn();
  } finally {
    await page.setRequestInterception(false);
    page.off('request', onRequest);
  }
}

async function loadedScreens(page) {
  // Home — loaded
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('.card.group');
  await shot(page, '01-home-loaded.png');

  // Home — empty (no search results)
  await page.type('#dev-search', 'zzzzzz');
  await page.waitForFunction(
    () => document.body.textContent?.includes('No developers match'),
  );
  await shot(page, '02-home-empty.png');

  // Developer profile with suggested collaborators
  await page.goto(`${BASE}/developers/wlTsdCls`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('h1');
  await page.waitForFunction(() =>
    document.body.textContent?.includes('Suggested collaborators'),
  );
  await shot(page, '03-developer-profile.png');

  // Developer profile — not found (404 → friendly empty state)
  await page.goto(`${BASE}/developers/does-not-exist`, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() =>
    document.body.textContent?.includes("isn’t in the network"),
  );
  await shot(page, '03a-developer-not-found.png');

  // Path finder — render a path between two linked developers
  await page.goto(`${BASE}/path-finder?from=wlTsdCls&to=lnYcw7d1`, {
    waitUntil: 'networkidle0',
  });
  await page.waitForFunction(() =>
    document.body.textContent?.includes('Connection found'),
  );
  await shot(page, '04-path-finder.png');

  // Skill affinity dashboard
  await page.goto(`${BASE}/affinity`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('.card [role="img"]');
  await shot(page, '05-skill-affinity.png');

  // Team builder — pick a few skills, show ranked candidates
  await page.goto(`${BASE}/team-builder`, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() =>
    document.body.textContent?.includes('Pick required skills'),
  );
  const pick = async (label) => {
    const handles = await page.$$('button');
    for (const h of handles) {
      const text = await h.evaluate((el) => el.textContent ?? '');
      if (text.trim().startsWith(label)) {
        await h.click();
        return true;
      }
    }
    return false;
  };
  await new Promise((r) => setTimeout(r, 800)); // let skill chips paint
  await pick('TypeScript');
  await pick('NestJS');
  await pick('React');
  await page.waitForFunction(() =>
    document.body.textContent?.includes('Candidate developers'),
  );
  await shot(page, '06-team-builder.png');

  console.log('Loaded/empty shots done.');
}

async function loadingScreens(page) {
  // Home — skeletons (API artificially delayed)
  await slowApi(page, async () => {
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.skeleton');
    await shot(page, '00-home-loading.png');
  });
  await page.waitForFunction(() => document.querySelectorAll('.card.group').length > 0);
  console.log('Loading shots done.');
}

async function errorScreens(page) {
  // Backend unreachable: abort every /api request so the app shows its error banner.
  await page.setRequestInterception(true);
  const onRequest = (req) => {
    if (req.url().startsWith(`${BASE}/api`)) req.abort();
    else req.continue();
  };
  page.on('request', onRequest);

  try {
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle0' });
    await page.waitForFunction(() =>
      document.body.textContent?.includes('Something went wrong'),
    );
    await shot(page, '00-home-error.png');
  } finally {
    await page.setRequestInterception(false);
    page.off('request', onRequest);
  }
  console.log('Error shots done.');
}

const subset = process.argv[2] ?? 'all';
const page = await browser.newPage();

if (subset === 'all' || subset === 'loaded') await loadedScreens(page);
if (subset === 'all' || subset === 'loading') await loadingScreens(page);
if (subset === 'all' || subset === 'error') await errorScreens(page);

await browser.close();
console.log('Done.');