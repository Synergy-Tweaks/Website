<!-- generated-by: gsd-doc-writer -->
# Configuration

This is a static site: plain HTML, CSS and two JavaScript files, with no build
step and no runtime dependencies. All site configuration therefore lives in a
single browser JavaScript file, `js/config.js`, plus two conventions that must be
kept in sync by hand — the `TODO-SET-DOMAIN` placeholders and the `?v=`
cache-busting query strings. CI uses exactly one environment variable,
`GITHUB_TOKEN`.

## How configuration is loaded

Every page loads the config before the behaviour script, both as plain script
tags in `<head>`:

```html
<script src="js/config.js"></script>
```

`js/main.js` (loaded with `defer` at the end of `<body>`) reads
`window.SITE || {}`, so a page that fails to load `js/config.js` degrades to
static `href`s already present in the markup rather than throwing.

`js/config.js` assigns a single global:

```js
window.SITE = { /* ... */ };
```

There is no `.env` file, no JSON config, no build-time substitution, and no
server configuration. Anything that changes per deployment is either edited in
`js/config.js` / HTML by hand, or set as a GitHub Actions secret (see
[Environment variables](#environment-variables)).

## `SITE` reference

| Key | Value in repo | Consumed by |
| --- | --- | --- |
| `org` | `'Synergy-Tweaks'` | Declared only — `js/main.js` uses `orgUrl` |
| `orgUrl` | `https://github.com/Synergy-Tweaks` | `[data-link="org"]` anchors |
| `discord` | `https://dsc.gg/kwanteks` | `[data-link="discord"]` anchors |
| `youtube` | `https://www.youtube.com/@kwanteks` | `[data-link="youtube"]` anchors |
| `twitter` | `https://x.com/synergyos48` | `[data-link="twitter"]` (no anchor currently uses it) |
| `ameWizard` | `https://download.ameliorated.io/AME%20Beta.zip` | `[data-link="ame"]` anchors |
| `windows11` | `https://www.microsoft.com/software-download/windows11` | `[data-link="windows11"]` anchors |
| `origin` | `''` (empty) | Nothing yet — see [TODO-SET-DOMAIN](#todo-set-domain-placeholders) |
| `repos` | object, see below | Downloads, changelogs, `[data-repo]` anchors |
| `compatibility` | `'Windows 10 22H2 and Windows 11 22H2–26H2 (LTSC included; 26H2 experimental)'` | Declared only — page copy is written out in the HTML |
| `team` | object, see below | Declared only — About page markup is static |

Comment at the top of `js/config.js`: the Discord invite is the canonical value;
change it there and keep the hard-coded `href`s in the HTML in sync (the HTML
`href` is the no-JavaScript fallback). `tools/check.mjs` enforces this — any
`discord.gg` / `dsc.gg` URL in any page that differs from `SITE.discord` fails
the check.

### `SITE.repos`

Two repositories are fully described; a third carries only a URL.

```js
repos: {
  SynergyOS: {
    url: 'https://github.com/Synergy-Tweaks/SynergyOS',
    releases: 'https://github.com/Synergy-Tweaks/SynergyOS/releases',
    latest: 'https://github.com/Synergy-Tweaks/SynergyOS/releases/latest',
    ext: '.apbx',
    asset: '',        // empty = resolve the asset name from the GitHub API
    fallback: 'https://github.com/Synergy-Tweaks/SynergyOS/releases/latest',
  },
  SynToolkit: { /* same shape, ext: '.exe' */ },
  OriginalPostInstall: {
    url: 'https://github.com/Synergy-Tweaks/Original-Post-Install',
  },
}
```

| Field | Meaning |
| --- | --- |
| `url` | Repository page; used by `[data-link="synergyos"]` / `[data-link="syntoolkit"]` / `[data-link="opi"]` |
| `releases` | Releases listing; used by `[data-link="*-releases"]` |
| `latest` | `releases/latest` page; used as a download fallback |
| `ext` | Asset extension used to pick the download from the release's assets (`.apbx`, `.exe`) |
| `asset` | Exact asset filename. Empty means "resolve from the API by `ext`". When set, it is used to seed the download `href` immediately on page load, before any network call |
| `fallback` | Last-resort download URL if the API is unreachable and no asset name is known |

Download `href`s are never version-pinned. `js/main.js` builds
`https://github.com/Synergy-Tweaks/{repo}/releases/latest/download/{asset}` and
resolves the asset name from `asset`, then from the newest non-draft,
non-prerelease release whose asset ends in `ext`. `tools/check.mjs` fails the
build if a `releases/download/<digit>` URL appears in `js/config.js` or any page.

`OriginalPostInstall` has no `ext` / `asset` / `fallback`, so it is link-only (no
download button).

Download anchors in the HTML opt in with `data-repo` and `data-ext`:

```html
<a class="btn btn-primary"
   href="https://github.com/Synergy-Tweaks/SynergyOS/releases/latest"
   data-repo="SynergyOS" data-ext=".apbx">Download SynergyOS</a>
```

The `href` is the fallback; Ctrl/Cmd/middle-click keeps it.

### `SITE.team`

Declared in config but not read by `js/main.js` — the About page (`about.html`)
and `credits.html` hold the markup. Shape:

| Field | Meaning |
| --- | --- |
| `leads[]` | `{ name, role, github, avatar }` per team lead; `avatar` is a repo-relative path under `images/profiles/` |
| `contributors.<repo>.graph` | `contrib.rocks` embed URL for the contributor avatar wall |
| `contributors.<repo>.url` | GitHub contributors graph page |

## TODO-SET-DOMAIN placeholders

The production origin is not set yet: `SITE.origin` is `''` and every absolute
URL in the markup uses the literal string `TODO-SET-DOMAIN`. Replace all of
them at once when the domain exists.

| File | Placeholders |
| --- | --- |
| `index.html` | `canonical`, `og:url`, `og:image`, `twitter:image` |
| `synergyos.html` | `canonical`, `og:url`, `og:image`, `twitter:image` |
| `syntoolkit.html` | `canonical`, `og:url`, `og:image`, `twitter:image` |
| `docs.html` | `canonical`, `og:url`, `og:image`, `twitter:image` |
| `about.html` | `canonical`, `og:url`, `og:image`, `twitter:image` |
| `privacy.html` | `canonical`, `og:url`, `og:image` |
| `credits.html` | `canonical`, `og:url`, `og:image` |
| `robots.txt` | `Sitemap:` line (plus a TODO comment above it) |
| `sitemap.xml` | all seven `<loc>` entries (plus a TODO comment) |

Notes:

- `canonical` and `og:url` are absolute URLs — a relative value will not work.
- `og:image` / `twitter:image` point at `https://TODO-SET-DOMAIN/images/og.jpg`.
  The file in the repo is `images/og.jpg`; crawlers need the absolute form.
- `robots.txt` and `sitemap.xml` are **not** generated. They are edited by hand,
  and `tools/check.mjs` only checks that they exist, not their contents.
- `TODO-SET-DOMAIN` is not imported from `js/config.js`; setting `SITE.origin`
  alone changes nothing in the served HTML. <!-- VERIFY: no custom domain is currently configured for this site; production origin is unknown from the repository -->
- Other, unrelated TODOs exist in `index.html` (`TODO: fill with my measured
  values` for comparison metrics). `tools/check.mjs` requires that string to
  remain, so do not remove it while swapping domain placeholders.

## `?v=` cache-busting convention

Assets are referenced with a manual version query string so long-cached browsers
pick up edits. Current values:

| Asset | Reference | Version |
| --- | --- | --- |
| `styles.css` | `styles.css?v=21` | `21` |
| `js/main.js` | `js/main.js?v=16` | `16` |
| `js/config.js` | `js/config.js` (no query) | — |

Rules:

1. After editing `styles.css`, bump `?v=` on the stylesheet link — in **all
   seven** HTML pages, not just the one you changed.
2. After editing `js/main.js`, bump `?v=` on the script tag — again in all seven
   pages. Each file carries its own independent counter.
3. `js/config.js` is deliberately unversioned. Do not add a `?v=` to it; the
   `tools/check.mjs` rule matches the literal substring `js/config.js`, and the
   file is expected to be re-read on every page load.
4. The numbers only need to increase — pick the next integer, or any string the
   browser has not seen. Nothing computes them.

`tools/check.mjs` tolerates the query string (`/styles\.css(\?[^"]*)?/`,
`/js\/main\.js(\?[^"]*)?/`) and requires `js/config.js`, so a stale or missing
version bump is not caught automatically. It is a human convention.

## Environment variables

| Variable | Required | Default | Where |
| --- | --- | --- | --- |
| `GITHUB_TOKEN` | Optional | unset → unauthenticated requests | `.github/workflows/releases.yml`; `tools/fetch-releases.mjs` |

`tools/fetch-releases.mjs` is the only consumer:

```js
const token = process.env.GITHUB_TOKEN || "";
const headers = { Accept: "application/vnd.github+json", "User-Agent": "synergy-site" };
if (token) headers.Authorization = `Bearer ${token}`;
```

- Locally the variable is optional. Without it the script still runs, against
  GitHub's unauthenticated rate limit.
- In CI `releases.yml` passes the workflow's own token:

  ```yaml
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  ```

  `secrets.GITHUB_TOKEN` is provided by Actions automatically — you do not create
  it. The workflow also declares `permissions: contents: write` so the refresh
  job can commit `data/releases.json` back to `main`.
- No `GITHUB_TOKEN` is used by the browser code. `js/main.js` calls the public
  GitHub API unauthenticated, which is why the snapshot in `data/releases.json`
  exists as a fallback.
- `tools/check.mjs` takes no environment variables and needs none.
- Node.js 20 is the version both workflows pin (`actions/setup-node@v4`,
  `node-version: "20"`). No `engines` field or `.nvmrc` exists in the repo.

## Runtime constants in `js/main.js`

Not exposed as configuration, but these are the values to change if cache
behaviour or API pressure needs tuning:

| Constant | Value | Purpose |
| --- | --- | --- |
| `CACHE_KEY` | `'synergy-releases-v3'` | `localStorage` key for release data |
| `TTL` | `60 * 60 * 1000` (1 hour) | Release cache lifetime |
| `REPOS` | `['SynergyOS', 'SynToolkit']` | Repos hydrated on page load |
| `CHANGELOG_CACHE` | `'synergy-changelog-v2'` | `localStorage` key prefix, suffixed with the repo name |
| `CHANGELOG_TTL` | `60 * 60 * 1000` (1 hour) | Changelog cache lifetime |
| API timeout | `3000` ms (`AbortSignal.timeout`) | Per-request limit when resolving a download on click |
| API page size | `per_page=100` (releases), `per_page={limit}` (changelogs) | GitHub API queries |

Renaming `CACHE_KEY` or `CHANGELOG_CACHE` is the supported way to invalidate
everyone's cached copy after a data-shape change.

## Data snapshot files

`data/` holds content that behaves like configuration but is generated or
hand-maintained JSON. Two files are fetched at runtime from repo-relative paths
(`data/releases.json`, `data/known-issues.json`), so the site must be served from
the repository root.

| File | Owner | Notes |
| --- | --- | --- |
| `data/releases.json` | Generated by `tools/fetch-releases.mjs` | Do not edit by hand. Refreshed every 6 hours by `releases.yml`; committed only when a release changes. Carries no download counts |
| `data/known-issues.json` | Hand-maintained | Read by `js/main.js` for the `[data-known-issues]` block; keys `version`, `notice`, `items[]` |
| `data/changelog.json` | Hand-maintained | No code reads it today — `js/main.js` renders changelogs from the GitHub API. `tools/check.mjs` only asserts the file exists |

## Verifying a configuration change

```bash
node tools/check.mjs
```

Run from the repository root. It fails on: missing pages/assets, a Discord URL
that differs from `SITE.discord`, version-pinned download URLs, dead local links
and anchors, missing image `alt`/dimensions, unbalanced tags, and missing
meta/canonical tags. It does **not** validate `TODO-SET-DOMAIN`, `?v=` values,
or JSON contents. CI runs the same script on every push to `main` and every pull
request (`.github/workflows/check.yml`).
