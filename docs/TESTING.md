<!-- generated-by: gsd-doc-writer -->

# Testing

## What exists instead of a test suite

There is no test framework, no runner, no assertion library, and no `package.json`
in this repository. The site is static HTML/CSS/JS with no build step, so the only
automated verification is a single Node script:

```
tools/check.mjs
```

It is a static linter over the repository contents, not a behavioural test. It
reads files from disk, accumulates every failure in an array, prints them all to
stderr, and exits `1` if any check failed. On success it prints:

```
page check passed (7 html files)
```

There is nothing to install — `check.mjs` imports only `node:fs` and `node:path`.
CI runs it on Node 20; any recent Node LTS works locally.

## Running the checks

Run from the repository root (all paths inside the script are relative, and pages
are found with `readdirSync(".")`, so it checks the root `*.html` files only):

```bash
node tools/check.mjs
```

There is no watch mode, no way to run a single page or a single check, and no
`--fix`. The whole script runs in well under a second, so just re-run it.

Exit codes:

| Code | Meaning |
| --- | --- |
| `0` | All checks passed; one summary line on stdout |
| `1` | One or more checks failed; every failure printed to stderr, one per line |

Failure lines are prefixed with the file that failed, except the required-file
checks and the cross-page download checks, which are repository-level.

## What `check.mjs` validates

### Repository-level requirements

- All seven pages exist at the root: `index.html`, `synergyos.html`,
  `syntoolkit.html`, `docs.html`, `about.html`, `privacy.html`, `credits.html`.
- These files exist: `styles.css`, `js/config.js`, `js/main.js`,
  `data/changelog.json`, `data/known-issues.json`, `robots.txt`, `sitemap.xml`.
- The legacy `script.js` does **not** exist.

### Every root HTML page

The script discovers pages by listing root `*.html` files, so a new page is
checked automatically — and must satisfy everything below. HTML comments are
stripped before these checks, so commented-out markup does not trip them.

- **Forbidden leftovers:** no `fonts.googleapis.com`, no `cloudflareinsights`
  beacon, no `Happy holidays`, no `class="snow"`, no `fsos` (case-insensitive).
- **Document structure:** a `<main>` element, exactly one `<h1>`, a
  `name="description"` meta tag, `og:title`, `theme-color`, and
  `rel="canonical"`.
- **Assets wired up:** `styles.css` and `js/main.js` are referenced (an optional
  `?v=` query is allowed), and `js/config.js` is included.
- **Accessibility basics:** a `skip-link` is present; every `<img>` has `alt`;
  local images (not `data:` or `http`) also have `width` and `height` and point
  at a file that exists on disk.
- **Discord consistency:** `check.mjs` extracts `SITE.discord` from
  `js/config.js` with a regex, then any `discord.gg/…` or `dsc.gg/…` URL in a
  page must match it exactly. A second invite anywhere in the HTML is a failure.
- **Link hygiene:** every `<a target="_blank">` must carry
  `rel="…noopener noreferrer…"`.
- **Anchors:** every in-page `href="#id"` must have a matching `id` in the same
  page.
- **Local links resolve:** every non-`http`, non-`mailto:`, non-`data:`,
  non-`#` href is resolved on disk after stripping `?query` and `#fragment`.
  This covers `a[href]` only — it does not resolve `src` on scripts or links.
- **Tag balance:** a naive stack walk over all tags. Void elements (`area`,
  `base`, `br`, `col`, `embed`, `hr`, `img`, `input`, `link`, `meta`, `source`,
  `track`, `wbr`) and self-closing tags are skipped. A mismatched close reports
  `unbalanced tag </x> closes <y>` and stops checking that page; leftovers
  report `unclosed tags: …`.

### Release-resolution invariants

These protect the "never link to a version-pinned asset" rule:

- `js/main.js` must not contain the old org path `kwanteks/SynergyOS`.
- `js/main.js` must still define `resolveLatestDownload` or `latestDownloadUrl`.
- `js/config.js` must not contain `releases/download/<digit>`.
- No HTML page may contain a `releases/download/…` href that is not
  `releases/download/latest/…`.

### Home page content guards

`index.html` must still contain the literal comparison placeholder
`TODO: fill with my measured values`, and must not contain `1200+`, `Real FPS`,
`turbo-charged`, or `Happy holidays` (case-insensitive).

## What it does not check

Knowing the gaps is the point of the manual checklist below:

- `?v=` cache-busting values — nothing verifies they were bumped after editing
  `styles.css` or `js/main.js`.
- `SITE.origin` is still `''`, so the `TODO-SET-DOMAIN` placeholders in canonical
  and Open Graph tags pass unnoticed.
- Contents of any JSON file (only existence of `data/changelog.json` and
  `data/known-issues.json`).
- CSS at all, and external URLs (no network requests are made).
- Cross-page anchors (`page.html#id`) — only same-page `#id` anchors.
- Real HTML validity; the tag balance walk is not a parser.
- Anything at runtime: hydration, download redirects, fallbacks, clipboard,
  scroll reveal, mobile menu.
- Any download asset actually existing in a GitHub release.

## CI integration

`.github/workflows/check.yml`, workflow name **Check site**:

- Triggers: every push to `main`, and every pull request.
- Runs on `ubuntu-latest`, checks out with `actions/checkout@v4`, installs Node
  `20` via `actions/setup-node@v4`.
- Single step: `node tools/check.mjs`.

A pull request that fails any check is red until it is fixed. Note that
`.github/workflows/releases.yml` (the 6-hourly `data/releases.json` refresh)
does **not** run `check.mjs`; it only regenerates the snapshot, commits
`data/releases.json` as `data: refresh release snapshot` when it changed, and
pushes to the same branch. If a scheduled refresh breaks a page, the next push or
PR check is where it surfaces.

## Coverage

No coverage tooling and no thresholds. `check.mjs` has no notion of which lines or
branches it exercised; there is nothing to configure or raise.

## Verifying the release fallback with `data/releases.json`

`js/main.js` has a three-step chain for release data: `localStorage` cache (1 hour,
key `synergy-releases-v3`) → GitHub REST API → `data/releases.json`. Downloads
resolve separately: cached/API filename → `releases/latest/download/<filename>` →
`SITE.repos[repo].fallback` (the release page). Changelogs follow the same pattern
with key `synergy-changelog-v2:<repo>` and fall back to the snapshot's `notes`.

To exercise the snapshot path:

1. Serve the repository root (see the local development section in `README.md`) and open
   `synergyos.html` or `syntoolkit.html`.
2. In DevTools → Application → Local Storage, delete `synergy-releases-v3` and
   `synergy-changelog-v2:SynergyOS` / `synergy-changelog-v2:SynToolkit`.
   (Or wait out the 1-hour TTL.)
3. In DevTools → Network, enable request blocking for `api.github.com`, then
   reload.
4. Confirm the version badge, filename, size and SHA-256 on the page match
   `data/releases.json` for that repo, and that the changelog block still renders
   the release notes.

Expected results and how to read them:

- Version, filename, size, and SHA populate from the snapshot (`sha` is the
  `digest` field with the `sha256:` prefix stripped).
- Download counts do **not** exist in `data/releases.json`, so the facts-list
  `downloads` row keeps its static `—`, and the home-page downloads counter stays
  hidden (`.hero-downloads` is `display: none` until JS marks it `is-ready`).
  That is correct behaviour, not a bug.
- A download button clicked with the API blocked should land on the repo's
  `releases/latest` page rather than a direct asset URL, because the filename is
  unknown to `SITE.repos` (`asset` is empty by design).
- Changelog fallback only uses the snapshot when the API request throws; if the
  snapshot is also unreachable the static HTML inside `[data-changelog]` remains.

You can also regenerate the snapshot locally to confirm the generator works:

```bash
node tools/fetch-releases.mjs
```

It writes `data/releases.json` in place (committing that by hand is not the
normal path — CI owns it), and needs network access. An optional `GITHUB_TOKEN`
raises the API rate limit.

## Manual checks before a release

Automated checks never touch the network, so these are the ones that catch
real-world breakage. Do them on the deployed site, not `localhost`.

1. **Every download link returns 200.** GitHub's `releases/latest/download/NAME`
   URL 302-redirects and returns 404 if the newest release has no asset with that
   exact name — the most common release-day failure, and something no file-based
   check can see. Check the hrefs on `index.html`, `synergyos.html`, and
   `syntoolkit.html`, following redirects:

   ```bash
   curl -sIL -o /dev/null -w '%{http_code} %{url_effective}\n' \
     https://github.com/Synergy-Tweaks/SynergyOS/releases/latest/download/SynergyOS.apbx
   ```

   Expect `200` at the end of the chain. Repeat for the SynToolkit `.exe` href.
   Also confirm the size and SHA-256 shown on the page match the asset you just
   fetched (`sha256sum <file>`, or `Get-FileHash -Algorithm SHA256 <file>` in
   PowerShell).

2. **No-JavaScript behaviour.** Disable JavaScript in DevTools and reload all
   seven pages. Expected: layout and copy intact; release fields show their static
   placeholders (`—`, `Loading from GitHub…`); download buttons still work via
   their hard-coded `releases/latest` href; the synergyos changelog block keeps its
   static fallback HTML; the known-issues block is empty (it is JS-only); the
   mobile menu still opens (it is `<details>`-based). Anything that renders blank
   is a regression.

3. **Mobile widths.** Check 360 px, 390 px, and 768 px in responsive mode:
   header/nav menu, hero buttons, comparison table (must scroll or wrap, not
   overflow the body), changelog `<pre>` blocks (horizontal scroll inside the
   block, not page-wide), and images (no layout shift — `width`/`height` are
   already enforced by the checker).

4. **Lighthouse.** Run it against the production URL for Performance,
   Accessibility, Best Practices, and SEO, on mobile and desktop, and record the
   numbers so regressions are visible next release. Expect SEO to be penalised
   while `SITE.origin` is empty and canonical/OG URLs still contain the
   `TODO-SET-DOMAIN` placeholder — read the report with that in mind instead of
   chasing it. `check.mjs` is not a substitute for this: it cannot see rendering,
   contrast, tap-target size, or real network waterfalls.

5. **Cached-vs-fresh assets.** Hard-reload after deploy and confirm the new
   `styles.css` / `js/main.js` are actually served — i.e. that `?v=` was bumped.
   This is the failure mode the script cannot detect.

## Adding a new check

There is no framework to extend, only the `must(condition, message)` helper at the
top of `tools/check.mjs`: it pushes the message onto `fail` when the condition is
false, and the script exits non-zero at the end. Add a `must(...)` call in the
relevant block — repository-level, per-page, or release invariants — and give the
message a `file: reason` shape so the failing page is obvious. Prefer a check that
fails on a realistic mistake (a missing asset, a stale URL, a broken anchor) over
one that restates the current markup.
