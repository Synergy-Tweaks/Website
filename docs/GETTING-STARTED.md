<!-- generated-by: gsd-doc-writer -->

# Getting started

This repository is the static website for Synergy Tweaks — seven hand-written HTML pages, one stylesheet, and two browser scripts. There is no framework, no `package.json`, no dependency install and no build step. "Getting started" means serving the folder over HTTP and opening a page.

## Prerequisites

| Tool | Why you need it | Notes |
| --- | --- | --- |
| Git | To clone the repository | Any recent version |
| Python 3 | Runs the local static server (`python -m http.server`) | Stdlib only — no `pip install`. Any other static file server works too |
| Node.js 20 | Only for `tools/check.mjs` and `tools/fetch-releases.mjs` | The version both GitHub Actions workflows pin (`actions/setup-node@v4`, `node-version: "20"`) |
| A modern browser | To view the site | JavaScript on for release data; the pages still read without it |

You do **not** need: npm/yarn/pnpm, a `node_modules` folder, a `.env` file, a database, or a compiler. There is no `.nvmrc` or `engines` field — Node 20 is simply what CI uses.

## Get the files

```bash
git clone https://github.com/Synergy-Tweaks/Website.git
cd Website
```

## Run the site locally

From the repository root:

```bash
python -m http.server 8080
```

Then open <http://localhost:8080/>.

Two things matter here:

- **Run it from the repository root.** The scripts fetch `data/releases.json` and `data/known-issues.json` by repo-relative path, so serving a parent or child directory breaks the dynamic parts.
- **Serve over HTTP, not `file://`.** Browsers block `fetch()` of local files from a `file://` page, so opening `index.html` directly by double-clicking leaves the release fields, changelog and known issues unpopulated — the static placeholder text (`—`, `Loading from GitHub.`) just stays there.

Stop the server with `Ctrl+C`. The README's one-liner (`python -m http.server 8080`) is the only documented run command; on Windows you can also use the Python launcher form `py -m http.server 8080`.

## What to open

Every page is standalone HTML in the repository root and shares the same header, nav and footer.

| Page | URL | What is on it |
| --- | --- | --- |
| `index.html` | <http://localhost:8080/> | Home — hero, verifiable facts (`#stats`), what SynergyOS changes (`#features`), comparison (`#compare`), SynToolkit teaser (`#syntoolkit`), source (`#opensource`), community (`#community`), team (`#team`) |
| `synergyos.html` | `/synergyos.html` | Playbook page — requirements (`#requirements`), install guide (`#install`), download (`#download`), risks (`#risks`), FAQ (`#faq`), changelog (`#changelog`), known issues (`#issues`) |
| `syntoolkit.html` | `/syntoolkit.html` | WinUI 3 companion app — feature list, screenshot, download (`#download`), GPL-3.0 note |
| `docs.html` | `/docs.html` | The site's documentation index — links out to the SynergyOS install guide, FAQ, GitHub READMEs and AME Wizard docs. **This is not the `docs/` folder** |
| `about.html` | `/about.html` | Team and contributors (`#team`) |
| `privacy.html` | `/privacy.html` | Privacy policy |
| `credits.html` | `/credits.html` | Credits and third-party libraries |

### What is dynamic

Only the release-related parts. On load, `js/main.js` fetches the latest GitHub releases for `SynergyOS` and `SynToolkit` and fills in version, filename, size, SHA-256, download count, download links and release notes. The changelog comes from the GitHub Releases API; known issues always come from the local `data/known-issues.json`.

If a value stays as `—` or `Loading from GitHub.`:

- check the browser console and the Network tab — the request to `api.github.com` is unauthenticated and can be rate-limited,
- the page should still fall back to `data/releases.json`, which carries no download counts (the counter stays hidden rather than showing a stale number),
- to force a fresh fetch, clear the `synergy-releases-v3` key in `localStorage` and reload.

## Run the checks (optional, Node)

Both scripts must be run from the repository root — `tools/check.mjs` reads `./` directly.

```bash
node tools/check.mjs
```

The site linter. There is no test suite; this is the closest thing to one. On success it prints `page check passed (7 html files)`. It fails on dead local links and anchors, missing images (`alt`, `width`/`height`, file on disk), unbalanced tags, missing `<main>`/`<h1>`/meta/canonical/skip link, a Discord URL that differs from `js/config.js`, `target="_blank"` without `noopener noreferrer`, version-pinned `releases/download/…` URLs, and leftover placeholders. CI runs it on every push to `main` and every pull request (`.github/workflows/check.yml`).

```bash
node tools/fetch-releases.mjs
```

Regenerates `data/releases.json`. You normally do not need this — `.github/workflows/releases.yml` runs it every 6 hours and commits only when a release changed. `GITHUB_TOKEN` is optional and only raises the API rate limit:

```bash
GITHUB_TOKEN=ghp_xxx node tools/fetch-releases.mjs
```

On PowerShell (the shell the README uses) set the variable first: `$env:GITHUB_TOKEN="ghp_xxx"; node tools/fetch-releases.mjs`.

Do not hand-edit `data/releases.json`; it is generated.

## Reading order for the repo docs

The Markdown files in `docs/` are developer documentation for this repository, not pages of the site — the public documentation index is `docs.html` in the browser. (If you browse to `/docs/ARCHITECTURE.md` on the local server you get the raw Markdown, not a rendered page.)

1. `README.md` — what the site is, page list, structure, deploy notes. Start here.
2. `docs/GETTING-STARTED.md` — this file: prerequisites, local run, checks.
3. `docs/ARCHITECTURE.md` — how the pages, `js/config.js`, `js/main.js` and the release data fit together; the fallback chain (localStorage cache → GitHub API → `data/releases.json`); why the layout is flat.
4. `docs/CONFIGURATION.md` — `window.SITE` reference, `SITE.repos`, the `TODO-SET-DOMAIN` placeholders, the `?v=` cache-busting convention, `GITHUB_TOKEN`, and the runtime constants in `js/main.js`.
5. `README.md` § *Deploying* — where the site goes.

## Where the deployment instructions live

There is no `docs/DEPLOYMENT.md`. Deployment is a file copy — upload the repository root to any static host; there is no server, database or runtime process. The instructions live in:

- **`README.md` → “Deploying”** — target options (GitHub Pages, Cloudflare Pages, Namecheap, plain Apache) and the step-by-step GitHub Pages setup (Settings → Pages → Deploy from a branch → `main` → `/ (root)`).
- **`docs/ARCHITECTURE.md` → “Deployment shape”** — what the deployable artifact is and what is still a placeholder.
- **`docs/CONFIGURATION.md` → “TODO-SET-DOMAIN placeholders”** — the per-file list of `TODO-SET-DOMAIN` values (canonical, Open Graph, Twitter card, `robots.txt`, `sitemap.xml`) to replace before pointing a custom domain at the site.

The production host and domain are not recorded in the repository; `js/config.js` has `origin: ''` with a TODO. <!-- VERIFY: production hosting provider and canonical origin for the Synergy Tweaks site -->

## Common setup issues

**Release fields stay blank or show `—`.** You opened the HTML file directly (`file://`). Serve the repo root over HTTP instead. If you are already on `http://localhost:8080/`, check the Network tab — the unauthenticated GitHub API may be rate-limited; the `data/releases.json` snapshot should take over.

**Port 8080 is already in use.** Pick another port and use the same origin everywhere:

```bash
python -m http.server 8000
```

**Stylesheet or script edits do not show up.** `styles.css` and `js/main.js` are cache-busted by a hand-maintained `?v=` query string (`styles.css?v=21`, `js/main.js?v=16` — identical on all seven pages). Bump the number in **all seven** HTML files after editing either one. `js/config.js` is deliberately unversioned. Nothing computes these numbers, and `tools/check.mjs` does not validate them.

**`node tools/check.mjs` reports every page and asset as missing.** You are not in the repository root. The script resolves paths relative to the current working directory.

**The check fails on an image or a local link.** Local `href`s and `src`s resolve relative to the page that contains them, and images live under `images/` (with `icons/` and `profiles/` subfolders). A renamed or moved file breaks the check.

## Next steps

- Editing markup, styles or behaviour: read `docs/ARCHITECTURE.md` first — the header/nav/footer markup is duplicated across all seven pages, and `tools/check.mjs` is what keeps those copies honest.
- Changing links, downloads or repo details: `docs/CONFIGURATION.md`, then run `node tools/check.mjs`.
- Shipping: `README.md` § *Deploying*, plus the `TODO-SET-DOMAIN` list in `docs/CONFIGURATION.md`.

Contributions: the README asks you to run `node tools/check.mjs` before opening a pull request and not to hand-edit `data/releases.json`.
