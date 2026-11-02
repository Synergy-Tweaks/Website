<!-- generated-by: gsd-doc-writer -->

# Development

The Synergy Tweaks site is hand-written HTML, one stylesheet and two browser
scripts. There is no framework, no package manager, no bundler and no build step:
the repository root is the deployable artifact, and `node tools/check.mjs` is the
only thing standing between an edit and production. This document covers the
working conventions — where content goes, how the CSS and JS are organised, the
cache-bust convention, the `data-*` contract, the release snapshot, and how to
add or rename a page without leaving dead links behind.

## Local setup

1. Clone the repository and `cd` into it.
2. There is nothing to install. No `package.json`, no lockfile, no `node_modules`.
3. Serve the root over HTTP:

   ```powershell
   python -m http.server 8080
   ```

   Open <http://localhost:8080/>. Any static server works (`npx serve`, `php -S`,
   Apache, nginx). Serve over HTTP rather than opening `file://`, because
   `js/main.js` fetches `data/*.json` and `api.github.com`, and those requests do
   not behave the same from a `file://` origin.

Python is only needed if you use that particular server. Node.js 20 (the version
CI pins) is only needed for `tools/check.mjs` and `tools/fetch-releases.mjs`.

There are no environment variables for the site itself. The single optional one
is `GITHUB_TOKEN`, used only when regenerating the release snapshot from your
machine (see [Release snapshot workflow](#release-snapshot-workflow)).

## Where content lives

Every page is a standalone root-level HTML document. There is no templating, no
partials, and no content directory — the copy you edit in the HTML is the copy
that ships.

| File | Content it owns |
| --- | --- |
| `index.html` | Home: hero, stats (GitHub stars), fact cards, comparison table, download CTA, community section (`#community`) |
| `synergyos.html` | Playbook: requirements, install steps (`#install`), download card (version/filename/size/downloads/SHA), risks, FAQ (`#faq`), changelog (`#changelog`), known issues (`#issues`) |
| `syntoolkit.html` | Companion app: feature set and its own download card |
| `docs.html` | Static documentation index — a grid of cards, not a generated site |
| `about.html` | Team and contributors; the team markup is static even though `SITE.team` declares the same people |
| `privacy.html`, `credits.html` | Prose pages using the shared `.prose` section styles |

The rule for what goes where:

- Anything that does not change between releases is written directly in the HTML.
- Anything tied to a GitHub release (version, filename, size, SHA, download count,
  download URL, release notes, stars, known issues) is a placeholder element that
  `js/main.js` hydrates at runtime. Keep meaningful fallback text — a dash, a
  "Loading from GitHub…" line, or the real previous value — because that is what
  no-JavaScript visitors and crawlers see.

In-page links (`href="#install"`) require a matching `id="install"` **in the same
file**. `tools/check.mjs` fails on any `#anchor` with no matching `id`.

## Editing `styles.css`

One stylesheet, deliberately ordered so that later rules win without
`!important`:

1. Banner comment and `:root` design tokens (lines 3–40): colours (`--bg`,
   `--text`, `--text-dim`, `--accent`, `--warn`, `--danger`), spacing scale
   (`--space-1` … `--space-9`), radii, shadows, font stacks (`--font-display`
   Nunito, `--font-body` Manrope) and layout constants (`--max: 1120px`,
   `--nav-h: 72px`).
2. `@font-face` blocks for the self-hosted woff2 files in `fonts/`.
3. Base element styles (reset, `body`, headings, links, `:focus-visible`).
4. Component sections, each introduced by a banner comment:
   `/* ---------- Nav ---------- */`, Buttons, Badge / chip, Sections, Hero,
   Stats, Cards / grids, Compare, Screenshot slots, Download card, Stepper, FAQ,
   Callout, Team, Notice strip, CTA band, Footer, Prose pages.
5. Motion (`/* ---------- Motion ---------- */`, reveal transitions) and the
   responsive overrides from line ~991 onward.

When adding styles:

- Put the rules inside the matching component section. If the thing is genuinely
  new, add a new `/* ---------- Name ---------- */` banner in page order rather
  than appending loose rules at the bottom.
- Use the tokens (`var(--space-4)`, `var(--radius)`, `var(--text-dim)`) instead
  of new literals. The design is dark with a single accent; new colours should
  come from the token block, not from inline hex values.
- Put new media-query overrides at the end of the file (after the existing
  responsive blocks) so equal-specificity rules still win. The `900px` block
  after the prose section is the one early exception.
- Use kebab-case class names and `is-*` for state added by JS (`.is-scrolled`,
  `.is-visible`, `.is-ready`).
- Fonts stay self-hosted. `tools/check.mjs` fails if `fonts.googleapis.com`
  appears anywhere in a page.

Bump the `?v=` number after editing (next section).

## JavaScript wiring

Two files, two jobs.

**`js/config.js`** is data only — no logic, no side effects beyond assigning one
global. It is loaded blocking in `<head>` of every page, before anything else:

```html
<script src="js/config.js"></script>
```

It defines `window.SITE`: org URLs, Discord, YouTube, X, AME Wizard and Windows
11 links, the `origin` placeholder, `repos` descriptors (`url`, `releases`,
`latest`, `ext`, `asset`, `fallback`), the compatibility string and the team
data. See [CONFIGURATION.md](CONFIGURATION.md) for the full key reference.
Editing `config.js` never changes behaviour; editing `main.js` never changes a
URL.

**`js/main.js`** is all behaviour, wrapped in one IIFE, loaded `defer` at the end
of `<body>`:

```html
<script src="js/main.js?v=16" defer></script>
```

It reads `window.SITE || {}`, so a page that fails to load `config.js` degrades to
the hard-coded `href`s in the markup instead of throwing. In order, it:

1. rewrites `href`s for `[data-link]` elements from `SITE`,
2. toggles `is-scrolled` on `.site-header` past 8px of scroll,
3. closes the mobile `<details class="nav-menu">` when a menu link is clicked,
4. reveals `.reveal` elements with `IntersectionObserver` (disabled under
   `prefers-reduced-motion: reduce`),
5. wires `[data-copy-hash]` buttons (clipboard with a `textarea` fallback),
6. seeds `a[data-repo]` download links and intercepts their clicks to resolve the
   newest asset,
7. hydrates `[data-release][data-field]` slots and `.hero-downloads` counters,
8. loads changelogs, known issues and GitHub star counts.

Do not add page-specific selectors to `main.js`. Pages opt in declaratively
through the attributes below — that is the whole contract, and it is why the
script can stay identical across seven pages.

### The `data-*` contract

| Attribute | Read at | Behaviour |
| --- | --- | --- |
| `data-link="key"` | `js/main.js:5` | Replaces `href` with the matching `SITE` value. Keys: `discord`, `youtube`, `twitter`, `org`, `ame`, `windows11`, `synergyos`, `syntoolkit`, `synergyos-releases`, `syntoolkit-releases`, `opi`. Unknown keys are left alone, so the static `href` stays as the no-JS fallback. |
| `data-repo="Repo"` | `js/main.js:249` | Marks a download link. The value must match a key in `SITE.repos`. The `href` is seeded immediately from `SITE.repos[repo].asset` and replaced on click by the resolved latest asset. Ctrl/Cmd/middle-click is left to the browser. |
| `data-ext=".apbx"` | `js/main.js:258` | Asset extension used when the click resolver has to ask the API. Mirrors `SITE.repos[repo].ext`; keep both in sync. |
| `data-release="Repo"` + `data-field="…"` | `js/main.js:168` | Hydration slot. `data-release` must match a repo key in the fetched release data (`SynergyOS` / `SynToolkit`). `data-field` is one of `version`, `filename`, `size`, `downloads`, `sha`; the script switches on it and never hard-codes selectors. |
| `data-copy-hash="#id"` | `js/main.js:58` | A button whose value is a CSS selector; clicking copies that element's trimmed text. Used for the SHA (`data-copy-hash="#os-sha"`). |
| `data-changelog="Repo"` | `js/main.js:402` | Root element replaced with release-note articles. Its existing markup is the fallback if the API fails. |
| `data-limit="1"` | `js/main.js:406` | Number of releases rendered into a `data-changelog` root; defaults to `1`. |
| `data-known-issues` | `js/main.js:446` | Root replaced from `data/known-issues.json` (`version`, `notice`, `items[]`). Not an API call. |
| `data-github-stars="Repo"` | `js/main.js:459` | Writes `stargazers_count` into the element, or leaves the `—` placeholder. |

Two class-only hooks matter as well: `.reveal` (scroll animation target) and
`.hero-downloads` (download counter wrapper; `main.js` adds `.is-ready` only
after a real count is written, and the CSS hides it until then).

Adding a third repository means editing three places, because the repo list is
hard-coded: `SITE.repos` in `js/config.js`, the `REPOS` array at `js/main.js:98`,
and the `REPOS` map in `tools/fetch-releases.mjs:11`. The browser and the CI
snapshot script must agree on which repos exist, or the fallback data will be
missing during API failures.

Anything fetched from the API or read from JSON is escaped before it reaches
`innerHTML` (`escapeHtml`, and `renderReleaseBody` for release notes). Keep that
order: escape first, then format.

## Cache busting with `?v=`

`styles.css` and `js/main.js` are referenced with a hand-maintained query string:

```html
<link rel="stylesheet" href="styles.css?v=21">
<script src="js/main.js?v=16" defer></script>
```

Both files carry **the same number on all seven pages** and the two numbers move
independently — the stylesheet is at `v=21`, the script at `v=16`. After editing
either file, increment its number in every page:

```powershell
# stylesheet change
(Get-ChildItem *.html) | ForEach-Object {
  (Get-Content $_ -Raw) -replace 'styles\.css\?v=21', 'styles.css?v=22' |
    Set-Content $_ -NoNewline
}
```

`js/config.js` has no version parameter, so a change there can be served from
cache; hard-reload (Ctrl+F5) when testing config edits. Nothing in CI checks the
`?v=` numbers — this is a convention, and forgetting it ships stale files.

## Release snapshot workflow

`data/releases.json` is generated, never hand-written. `tools/fetch-releases.mjs`
is a dependency-free Node 20 ESM script that fetches the same GitHub endpoint the
browser uses, picks the newest non-draft, non-prerelease release, selects the
asset by extension (`.apbx` / `.exe`), and writes `tag`, `name`, `published`,
`url`, `notes`, `filename`, `size`, `sha`, `download` with 2-space indentation.

Regenerate locally from the repository root:

```powershell
node tools/fetch-releases.mjs          # anonymous request
$env:GITHUB_TOKEN = "ghp_…"; node tools/fetch-releases.mjs   # higher rate limit
```

In CI, `.github/workflows/releases.yml` runs it on a `0 */6 * * *` cron and on
`workflow_dispatch`, using the built-in `GITHUB_TOKEN`. It stages only
`data/releases.json` and commits `data: refresh release snapshot` only if the
staged diff is non-empty — the snapshot deliberately omits download counts so the
job does not commit on every run. The workflow has `contents: write` and pushes
to `main` directly.

The other two data files are curated by hand:

- `data/known-issues.json` — `version`, `notice`, `items[]`; rendered live by
  `[data-known-issues]`.
- `data/changelog.json` — an offline reference/last-resort asset. `js/main.js`
  does **not** fetch it (the runtime fallback is `releases.json`), but
  `tools/check.mjs` requires the file to exist, so keep it.

## Commands

| Command | What it does |
| --- | --- |
| `node tools/check.mjs` | The site linter — the closest thing to a test suite. Run from the repository root, since it reads `.` and uses relative paths. Prints `page check passed (7 html files)` or lists every failure and exits 1. |
| `node tools/fetch-releases.mjs` | Regenerates `data/releases.json` from the GitHub API. |
| `python -m http.server 8080` | Local static server at <http://localhost:8080/>. |

There is no install step, no build command, no minification and no test runner.
`tools/check.mjs` is the whole verification story.

## Code style

There is no ESLint, Prettier, Biome, EditorConfig or `package.json` — nothing to
run and nothing to configure. Conventions are carried by imitation and enforced
where it matters by `tools/check.mjs`:

- **HTML** — 2-space indentation, lowercase attributes, double-quoted values,
  one `<main id="main">`, exactly one `<h1>`, a skip link, `alt` (empty `alt=""`
  for decorative images) plus `width`/`height` on every `<img>`, and
  `rel="noopener noreferrer"` on every `target="_blank"`.
- **CSS** — 2-space indentation, banner comments per component, tokens over
  literals, kebab-case classes, `is-*` state classes.
- **JS** — everything inside the one IIFE, `const`/`let`, single quotes,
  semicolons, optional chaining (`SITE.repos?.[repo]`) for anything that might be
  absent, `try { } catch { }` around storage and network so failures degrade
  quietly.
- **No dependencies** — no framework, no polyfill, no CDN script. The site is
  expected to work from a plain folder copy.

The mechanical rules the checker enforces are listed in
[ARCHITECTURE.md](ARCHITECTURE.md#checks-as-the-architectures-guardrail).

## Branch conventions

`main` is the default and the deploy branch: `check.yml` runs on pushes to
`main`, and the README documents GitHub Pages deploying from `main` / root. The
repository has no documented branch-naming convention and no
`.github/PULL_REQUEST_TEMPLATE.md` or `.github/ISSUE_TEMPLATE/`.

History uses short imperative commit subjects (`Drop the duplicate Download link
from the nav`, `Clear the actionable TODOs`) with an occasional prefix (`docs: …`).
If you need a convention, a short prefixed branch (`docs/…`, `fix/…`, `feat/…`)
and an imperative subject match what is already there.

## PR process

1. Make a single-purpose branch and keep the diff small — the nav and footer are
   duplicated across seven files, so broad edits get noisy fast.
2. Run `node tools/check.mjs` from the repository root before pushing; fix every
   reported failure rather than loosening the check.
3. Open the PR. `.github/workflows/check.yml` runs the same script on
   `ubuntu-latest` with Node 20 on every pull request; it is the gate.
4. Avoid including `data/releases.json` in a hand-made PR unless you are
   deliberately regenerating it — the scheduled workflow owns that file and
   writes its own commits.
5. Reviewers should look at what the checker cannot see: wording, layout at
   narrow widths, and whether a JS-hydrated element still has sensible fallback
   text.

## Adding, renaming, or removing a page

Because there is no templating, a page name appears in five kinds of places.
Missing one leaves either a dead link (caught by the checker if it is an `href`)
or a page nobody can navigate to (not caught).

1. **Create the file** at the repository root. Copy a small existing page such as
   `docs.html` as the skeleton so the head, nav, footer and script tags come with
   it. Every page must have:
   - `<link rel="stylesheet" href="styles.css?v=21">`
   - `<script src="js/config.js"></script>` in `<head>`
   - `<script src="js/main.js?v=16" defer></script>` before `</body>`
   - `name="description"`, `og:title`, `theme-color`, `rel="canonical"`
   - `<a class="skip-link" href="#main">`, `<main id="main">`, exactly one `<h1>`
2. **Add the nav link twice** in every page — once in `.nav-links` (desktop) and
   once in `.nav-menu-panel` inside `<details class="nav-menu">` (mobile). All
   seven pages; there are no includes.
3. **Add it to the footer** where it belongs (`Projects`, `Resources`, or
   `Legal`). Note that `docs.html`, `index.html`, `about.html`, `synergyos.html`
   and `syntoolkit.html` share the same three-column footer;
   `credits.html` and `privacy.html` have no footer columns at all, only a
   `.footer-bottom` bar, so there is no footer link to add there.
4. **Add a `<url><loc>…</loc></url>` entry** to `sitemap.xml`.
5. **Update `README.md`** — the Pages table, and the structure block if you added
   a directory.
6. **Update `tools/check.mjs`** if the page is meant to be mandatory: the
   `must(pages.includes("…"))` block at the top lists the seven required pages.
7. **Link it from anywhere it should be discovered** — `docs.html` cards, home
   CTAs, in-prose references. The checker verifies that a local `href` points at
   an existing file; it cannot know that a page is unreachable.

**Renaming** is all of the above plus a search for the old filename across the
HTML, `sitemap.xml`, `README.md` and `tools/check.mjs`. Let `node tools/check.mjs`
be your safety net: its "local link missing" failure is exactly the rename that
was half done. Renaming `index.html` or any of the seven required pages also
means updating the `must(pages.includes(...))` list, since the checker asserts
those exact names.

**Removing** a page is the reverse: delete the file, remove every nav/footer/
sitemap/README reference, drop it from `tools/check.mjs` if it was required, then
run the checker — leftover links are reported as missing local files.

You do **not** bump `?v=` when only HTML changes.

## What not to touch

- **`data/releases.json`** — generated by `tools/fetch-releases.mjs` and rewritten
  by CI every six hours. A hand edit is overwritten on the next run, and the
  file intentionally has no download counts.
- **`TODO-SET-DOMAIN`** — 36 placeholders across the seven pages' meta tags,
  `robots.txt` and `sitemap.xml` (`canonical`, `og:image`, `og:url`,
  `twitter:image`, `Sitemap:`), plus `origin: ''` in `js/config.js`. No production
  domain is defined in the repository, so do not invent one and do not delete the
  placeholders: replace them only when the real origin exists, and then set
  absolute URLs everywhere at once.
- **The home page comparison numbers** — the stock-vs-tweaked RAM and disk
  figures in `index.html` are samples, not measurements. They are marked by an
  HTML comment containing `MOCK-DATA` (directly above `<div class="compare">`)
  and by the visible "Sample figures" `.todo-note`. Replace the four values —
  stock idle RAM + process count, stock disk, SynergyOS idle RAM + process
  count, SynergyOS disk — then update the section lede, the `.todo-note` and
  delete the comment. `tools/check.mjs` asserts the marker and the note are
  still present, so removing them is a deliberate step.
- **`/releases/download/<tag>/…` URLs** — never version-pinned anywhere in HTML,
  `js/config.js` or `js/main.js`. Always the `/releases/latest/download/<asset>`
  form or the `/releases/latest` page. The checker fails a numeric tag.
- **Self-hosted fonts** — `fonts/` is preloaded in `about.html`, `docs.html`,
  `index.html`, `synergyos.html` and `syntoolkit.html` (`credits.html` and
  `privacy.html` have no preload links), and
  `fonts.googleapis.com` fails the check. Do not reintroduce a third-party font
  request.
- **`.superpowers/`** — ignored by git; local scratch space, not part of the site.
- **`data/changelog.json`** — not fetched at runtime, but `tools/check.mjs`
  requires it to exist. Deleting it breaks CI for no visible reason.
