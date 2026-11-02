<!-- generated-by: gsd-doc-writer -->

# Architecture

## System overview

The Synergy Tweaks website is a static, server-rendered-by-nobody site: hand-written HTML pages, one stylesheet, and two plain browser scripts. There is no framework, no bundler, and no build step — the repository root *is* the deployable artifact, and any static file server can host it.

The site's only dynamic behaviour is client-side hydration against the public GitHub REST API. `js/main.js` fetches the latest releases for `SynergyOS` and `SynToolkit`, then fills in version, filename, size, SHA-256 digest, download count, download links, and release notes into elements already present in the HTML. Everything a crawler or a no-JavaScript visitor sees comes from the static HTML; JavaScript only replaces placeholder text (`—`, `Loading from GitHub…`) and rewrites download `href`s.

Primary inputs: GitHub releases API, `data/releases.json`, `data/known-issues.json`, and the site config in `js/config.js`.
Primary outputs: static HTML pages, plus hydrated release metadata and download redirects.

The architectural style is **static multi-page + progressive client hydration**. Pages share one global design system and one behavioural script; there is no router, no component tree, and no shared server state.

## Component diagram

```
                    ┌───────────────────────────────┐
                    │  7 static HTML pages (root)   │
                    │  index / synergyos /          │
                    │  syntoolkit / docs / about /  │
                    │  privacy / credits            │
                    └───────┬───────────────┬───────┘
                            │ <link>        │ <script>
                            ▼               ▼
                    ┌──────────────┐  ┌──────────────┐
                    │ styles.css   │  │ js/config.js │  window.SITE
                    │ tokens +     │  │ (no logic)   │
                    │ components   │  └──────┬───────┘
                    └──────┬───────┘         │ read by
                           │ @font-face      ▼
                    ┌──────▼───────┐  ┌──────────────┐
                    │ fonts/       │  │ js/main.js   │  hydration
                    │ 3 × woff2    │  └──┬───┬───┬───┘
                    └──────────────┘     │   │   │
                                         │   │   └──────────────┐
                        fetch            │   │                  │ fetch
                                         ▼   ▼                  ▼
                        ┌────────────────────┐   ┌──────────────────────────┐
                        │ api.github.com     │   │ data/releases.json       │
                        │ releases + repo    │   │ data/known-issues.json   │
                        └────────────────────┘   └──────────────────────────┘
                                         ▲
                                         │ same API, Node fetch
                        ┌────────────────┴────────────────┐
                        │ tools/fetch-releases.mjs        │
                        │ (CI: .github/workflows/         │
                        │  releases.yml, every 6 h)       │
                        └─────────────────────────────────┘

                        tools/check.mjs ← .github/workflows/check.yml (push / PR)
                        images/ <── referenced by HTML at build-free runtime
```

`styles.css` and `js/main.js` are cache-busted with a `?v=` query string that must be bumped by hand when either file changes.

## Data flow

### Page load

1. The browser requests an HTML file from the static host. Navigation, page body, meta tags, and every release/download element's fallback text are already in that file.
2. `js/config.js` runs (blocking, in `<head>`) and assigns `window.SITE` — org URLs, Discord, socials, per-repo `ext`/`asset`/`fallback`, team data, compatibility string.
3. `js/main.js` runs (`defer`, end of body) and, in order: rewrites `[data-link]` `href`s from `SITE`, toggles the sticky-header class on scroll, closes the mobile `<details>` menu on navigation, installs `IntersectionObserver` reveals on `.reveal` elements, wires `[data-copy-hash]` buttons, resolves downloads, and hydrates release/changelog/known-issue regions.
4. If the page contains `[data-release]` or `a[data-repo]`, `loadReleaseData()` runs. It applies values to `[data-release][data-field]` nodes by a `switch` on `data-field` (`version`, `filename`, `size`, `downloads`, `sha`), then rewrites every `a[data-repo]` `href`.

### Release metadata fallback chain

`loadReleaseData()` resolves data in this order:

1. **localStorage cache** — key `synergy-releases-v3`, payload `{ts, data}`, valid for 1 hour (`TTL = 60 * 60 * 1000`).
2. **GitHub API** — `Promise.all` over `SynergyOS` and `SynToolkit`, each `GET https://api.github.com/repos/Synergy-Tweaks/{repo}/releases?per_page=100`. The newest non-draft, non-prerelease release wins (falling back to `releases[0]`). The asset is chosen by: configured `SITE.repos[repo].asset` name → first asset whose name ends with `SITE.repos[repo].ext` (`.apbx`, `.exe`) → first asset. Download totals sum `download_count` across all fetched releases. On success the result is written back to the cache.
3. **Snapshot** — on any API failure, `fetch('data/releases.json', {cache: 'no-store'})`. The snapshot carries `tag`, `name`, `published`, `url`, `notes`, `filename`, `size`, `sha`, `download` but **no download counts**, so the download counter simply stays hidden rather than displaying a stale number. If the snapshot also fails, the function returns and the static placeholder text remains.

Download counts are hidden until hydrated: `applyReleaseData()` sets `data-filled="1"` on a filled counter, which adds `is-ready` to its `.hero-downloads` wrapper — the counter is CSS-hidden until then.

### Download link resolution

Two independent paths, both deliberately non-version-pinned:

- **On render:** `latestDownloadUrl(repo, filename)` builds `https://github.com/Synergy-Tweaks/{repo}/releases/latest/download/{encodeURIComponent(filename)}`. With no filename it falls back to `SITE.repos[repo].fallback`, then `.latest`. `a[data-repo]` elements are also seeded immediately with the configured asset name so the `href` is correct before any network call.
- **On click:** the handler cancels the default navigation (except Ctrl/Cmd/middle-click) and calls `resolveLatestDownload(repo, ext)`, which tries: cached `download` → configured `asset` → `GET /releases/latest` with a 3 s `AbortSignal.timeout` and `.ext` asset match → `SITE.repos[repo].fallback`. Whichever resolves first is assigned to `window.location`.

The "never `releases/download/TAG/...`" rule is enforced in `tools/check.mjs`, so a version-pinned URL fails CI.

### Changelog and known issues

- **Changelog** (`[data-changelog="{repo}"]`, `data-limit` default `1`): per-repo cache key `synergy-changelog-v2:{repo}` (1 h) → `GET /releases?per_page={limit}` → one synthetic entry built from the `releases.json` snapshot for that repo → leave the static HTML in place. Release bodies are rendered by a small in-house markdown subset (`renderReleaseBody`): fenced code blocks, `-`/`*`/`+`/`1.` lists, `#`–`###` headings (emoji stripped), links, `**bold**`, and inline code, all HTML-escaped first.
- **Known issues** (`[data-known-issues]`): always local — `fetch('data/known-issues.json')` and render `version`, `notice`, and `items`. No API involved.
- **GitHub stars** (`[data-github-stars="{repo}"]`): `GET /repos/Synergy-Tweaks/{repo}` and write `stargazers_count`, or leave the `—` placeholder.
- `data/changelog.json` is a checked-in, human-curated fallback (enforced to exist by `tools/check.mjs`), but `js/main.js` does **not** fetch it — the runtime changelog fallback is the `releases.json` snapshot. Treat `data/changelog.json` as an offline reference/last-resort asset, not part of the live fetch chain.

### Snapshot generation

`tools/fetch-releases.mjs` is a Node 20 script (ESM, global `fetch`, no dependencies). It fetches the same releases endpoint, picks the same "latest" release and asset, and writes `data/releases.json` with 2-space indentation. `GITHUB_TOKEN` is optional; when present it raises the API rate limit. `.github/workflows/releases.yml` runs it on a `0 */6 * * *` cron and on `workflow_dispatch`, then commits only when `git diff --cached --quiet` reports a change.

## Key abstractions

| Abstraction | Location | Purpose |
| --- | --- | --- |
| `window.SITE` | `js/config.js` | Single source of truth for external URLs, per-repo release descriptors (`url`, `releases`, `latest`, `ext`, `asset`, `fallback`), compatibility string, and team data. Contains no logic. |
| `[data-link]` map | `js/main.js` (`document.querySelectorAll('[data-link]')`) | Declarative way for HTML to opt into config-driven `href`s (`discord`, `youtube`, `twitter`, `org`, `ame`, `windows11`, repo and release URLs). |
| `[data-release][data-field]` | `js/main.js` (`applyReleaseData`) | Declarative hydration contract — the HTML chooses which field goes where; the script never hard-codes selectors per page. |
| `latestDownloadUrl()` / `resolveLatestDownload()` | `js/main.js` | Single place that knows the `/releases/latest/download/` URL shape and the fallback order. |
| Cache helpers (`readCache`/`writeCache`, `readChangelogCache`/`writeChangelogCache`) | `js/main.js` | TTL-guarded `localStorage` wrappers; all failures are swallowed so private-mode or quota errors degrade to network-only. |
| `renderReleaseBody()` | `js/main.js` | Minimal, escape-first markdown renderer for GitHub release notes. |
| `fillFromJson(selector, url, render)` | `js/main.js` | Generic "fetch a JSON file and render into one root" helper, used for known issues. |
| Design tokens | `styles.css` `:root` | Colors (`--bg`, `--text`, `--accent`, `--warn`, `--danger`), radii, shadows, font stacks (`Nunito` display, `Manrope` body), layout (`--max: 1120px`, `--nav-h: 72px`). |
| `.reveal` / `.is-visible` | HTML + `js/main.js` + `styles.css` | Scroll-reveal animation, auto-disabled when `prefers-reduced-motion: reduce` matches. |
| `tools/check.mjs` | `tools/` | Zero-dependency site linter — the closest thing the project has to a test suite. |

## Checks as the architecture's guardrail

Because there is no compiler, `tools/check.mjs` is the enforcement layer. It reads every root `*.html` file and asserts: required pages exist, `styles.css`/`js/config.js`/`js/main.js` are linked, `<main>` and exactly one `<h1>` per page, meta description / `og:title` / `theme-color` / `rel="canonical"` present, skip link present, no Google Fonts / Cloudflare beacon / holiday leftovers, Discord URLs byte-identical to the `js/config.js` value, `target="_blank"` always paired with `noopener noreferrer`, no dead `#anchors`, every `<img>` has `alt` plus `width`/`height` and an existing local `src`, every local `href` exists on disk, balanced tags, and no version-pinned `releases/download/{digit}` URLs. `.github/workflows/check.yml` runs it on pushes to `main` and on every pull request.

## Directory structure rationale

```
index.html             home — hero, facts, comparison, downloads, community
synergyos.html         playbook page — requirements, steps, download, risks, FAQ, changelog
syntoolkit.html        companion app page — feature set, download card
docs.html              documentation index (static HTML, not a generated site)
about.html             team and contributors
privacy.html           privacy policy
credits.html           credits and third-party libraries
styles.css             one stylesheet: design tokens then component sections
js/config.js           data only: URLs, repo descriptors, team
js/main.js             all behaviour, in one IIFE
data/releases.json     generated release snapshot (CI-owned, do not hand-edit)
data/known-issues.json curated known-issues payload
data/changelog.json    curated offline changelog reference
images/                logos, OG card, banners, `icons/`, `profiles/`
fonts/                 self-hosted Nunito, Manrope, Anton (woff2)
tools/check.mjs        static site linter, run by CI
tools/fetch-releases.mjs  regenerates data/releases.json
.github/workflows/     check.yml, releases.yml
robots.txt, sitemap.xml
```

The layout is flat by intent. Every page sits at the repository root so relative links (`styles.css`, `js/main.js`, `images/...`, `data/...`) resolve identically from any page and from any subpath the site is hosted under. Shared markup (header, nav, footer) is duplicated per page rather than templated — that is the accepted cost of having no build step: editing the nav means editing seven files, and `tools/check.mjs` is what keeps the copies honest.

Splitting `js/` into `config.js` (pure data, loaded blocking in `<head>`) and `main.js` (all logic, `defer`) lets HTML and the external-link contract be updated without touching behaviour, and lets `main.js` be cache-busted independently. `tools/` is separate because its scripts run in Node during CI, never in the browser.

Fonts are self-hosted and preloaded specifically to avoid third-party font requests, which is also why `check.mjs` fails the build if a `fonts.googleapis.com` link appears.

## Deployment shape

Deployment is a file copy: upload the repository root to any static host (GitHub Pages, Cloudflare Pages, or a plain web server). There is no server, database, or runtime process. Two things are still placeholders rather than facts:

- `js/config.js` has `origin: ''` with a TODO, and the HTML head, `robots.txt`, and `sitemap.xml` contain `TODO-SET-DOMAIN` values for canonical, Open Graph, Twitter card, and sitemap URLs.
- The actual production host and domain for this site are not defined in the repository. <!-- VERIFY: production hosting provider and canonical origin for the Synergy Tweaks site -->
