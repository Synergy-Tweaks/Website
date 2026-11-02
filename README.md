# Synergy Tweaks website

The static site for [Synergy Tweaks](https://github.com/Synergy-Tweaks) — home for
[SynergyOS](https://github.com/Synergy-Tweaks/SynergyOS),
[SynToolkit](https://github.com/Synergy-Tweaks/SynToolkit), docs and the team.

Plain HTML, CSS and a little JavaScript. No framework, no build step, no runtime
dependencies. Drop the folder on any static host and it runs.

## Pages

| File | What it is |
| --- | --- |
| `index.html` | Home: what we build, facts, comparison, downloads |
| `synergyos.html` | Playbook: requirements, install steps, download, risks, FAQ, changelog |
| `syntoolkit.html` | The WinUI 3 companion app |
| `docs.html` | Documentation index |
| `about.html` | Team and contributors |
| `privacy.html` | Privacy policy |
| `credits.html` | Credits and third-party libraries |

## Structure

```
styles.css            design tokens + components
js/config.js          org links, Discord, socials, download fallbacks
js/main.js            release data, downloads, copy-SHA, reveals
data/releases.json    generated release snapshot (do not edit by hand)
data/known-issues.json
data/changelog.json   offline fallbacks
images/               logos, screenshots, profile art, icons, OG card
fonts/                Nunito + Manrope, self-hosted
tools/check.mjs       page check
tools/fetch-releases.mjs  regenerates data/releases.json
.github/workflows/    release refresh + page check
robots.txt
sitemap.xml
```

## Local development

```powershell
python -m http.server 8080
```

Open <http://localhost:8080/>. Any static server works.

After editing `styles.css` or `js/main.js`, bump the `?v=` number in the HTML so
browsers do not keep the old file.

## Release data

Publishing a GitHub release needs no site edits. On load, `js/main.js` fills in
version, filename, size, SHA-256 (asset digest), download count, download link and
release notes straight from the GitHub API, then caches the result for an hour.

`data/releases.json` is a snapshot for the cases where the API is rate-limited or
offline:

- `.github/workflows/releases.yml` refreshes it every 6 hours (or on demand) and
  commits only when a release actually changes.
- It carries no download counts, so the scheduled job does not commit on every run.
- When the API fails, version, size, SHA and notes still render from the snapshot;
  the download count hides rather than showing a wrong number.

Download buttons always resolve the newest asset. The plain `href` points at
`/releases/latest`, never a version-pinned file.

## Checks

```powershell
node tools/check.mjs
```

Runs on every push and pull request via `.github/workflows/check.yml`. It catches
dead links, missing images, broken tags, version-pinned download URLs and leftover
placeholders.

## Configuration

`js/config.js` holds Discord, GitHub, YouTube, AME Wizard and download fallbacks.
Keep matching `href`s in the HTML in sync for the no-JavaScript case.

## Deploying

Any static host works — GitHub Pages, Cloudflare Pages, Namecheap, plain Apache.
Upload the repository root; no server or database is involved.

GitHub Pages (free for public repositories):

1. **Settings → Pages**
2. **Source:** Deploy from a branch → `main` → `/ (root)`
3. Save. The site appears at `https://<org>.github.io/Website/` until a custom
   domain is connected.

## Before a custom domain

`TODO-SET-DOMAIN` placeholders sit in the HTML meta tags, `robots.txt` and
`sitemap.xml`. Replace them with the production origin, then set absolute
`canonical` / `og:url` / `og:image` URLs and a `Sitemap:` line.

## Contributing

Issues and pull requests are welcome. Run `node tools/check.mjs` before opening a
PR, and do not hand-edit `data/releases.json` — it is generated.

## License

Website code © Synergy Tweaks. SynergyOS and SynToolkit keep their own licenses in
their repositories.
