# Synergy Tweaks website

Static multi-page site for [Synergy Tweaks](https://github.com/Synergy-Tweaks): SynergyOS, SynToolkit, docs, about, privacy, and credits.

No framework, no build step, no runtime dependencies.

## Files

```
index.html            home
synergyos.html        playbook page (install, download, FAQ, risks)
syntoolkit.html       app page
docs.html             docs index (links to GitHub + on-site guides)
about.html            about / team
privacy.html          privacy policy
credits.html          credits
styles.css            design tokens + components
js/config.js          Discord, GitHub, socials, download fallbacks
js/main.js            releases API, copy hash, reveals, JSON render
data/known-issues.json
data/changelog.json   optional offline fallback (live changelog uses GitHub Releases API)
images/               logos, screenshots, icons, OG card
fonts/                Nunito + Manrope (self-hosted)
robots.txt
sitemap.xml
tools/check.mjs       page check
```

## Run locally

```powershell
python -m http.server 8080
```

Open <http://localhost:8080/>.

Bump `?v=` on `styles.css` and `js/main.js` after changing them.

## Check

```powershell
node tools/check.mjs
```

## Config

Edit `js/config.js` for Discord, GitHub, YouTube, AME Wizard, and download fallbacks. Keep matching `href`s in the HTML in sync (no-JS fallback).

### Discord

Site uses `https://dsc.gg/kwanteks` (`js/config.js`). Other invites may still appear off-site (e.g. SynergyOS README badge).

## Downloads

Buttons resolve the newest release asset from the GitHub API (and rewrite their `href` once data loads). Fallback `href` is `/releases/latest` — never a version-pinned asset URL. Release cards hydrate version, size, SHA-256 (when GitHub provides a digest), download counts and release notes with a one-hour `localStorage` cache.

## Automation

Publishing a GitHub release needs **no site edits**. On load, `js/main.js` reads the newest releases and fills in version, filename, size, SHA-256 (asset digest), download count, download link and release notes.

To survive GitHub's 60-requests-per-hour limit and offline visits, a snapshot lives in `data/releases.json`:

- `.github/workflows/releases.yml` refreshes it every 6 hours (or on demand from the Actions tab) and commits when a release actually changes.
- The snapshot holds no download counts, so the scheduled job does not commit on every run.
- If the API fails, the site falls back to the snapshot: version, size, SHA and notes still render; the download count hides instead of showing a wrong number.

`.github/workflows/check.yml` runs `node tools/check.mjs` on every push and pull request. No secrets are needed; both workflows use the built-in `GITHUB_TOKEN`.

Manual steps left: deploying the site, and editing `js/config.js` / HTML only when links or copy change.

## Production domain

Replace every `TODO-SET-DOMAIN` in HTML meta tags, `robots.txt`, and `sitemap.xml` before launch. Set `SITE.origin` in `js/config.js` when you have it.
