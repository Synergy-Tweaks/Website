# Synergy Tweaks website

One static page for [Synergy Tweaks](https://github.com/Synergy-Tweaks): SynergyOS
front and centre, SynToolkit and the smaller repos one click away.

No framework, no build step, no dependencies. Open it, ship it.

## Files

```
index.html          the page
styles.css          all styling
script.js           lightbox, modals, count-up, download resolution
images/             logo, screenshots, OG card
fonts/              Anton + Manrope, self-hosted latin woff2
tools/check.mjs     page check (dead anchors, missing images, stale URLs)
docs/               design and plan notes
```

## Run it locally

```powershell
python -m http.server 8080
```

Then open <http://localhost:8080/>. Any static server works; the page also opens
straight from disk, minus the GitHub API lookup on download.

`styles.css` and `script.js` carry a `?v=` number in `index.html`. Bump it after
changing either file, otherwise browsers (and hosts) keep serving the old copy.

## Check it

```powershell
node tools/check.mjs
```

It fails on dead in-page anchors, images without dimensions or missing files,
leftover Google Fonts requests, the old Cloudflare beacon, stale promo image
references, a missing `<main>`, and download anchors that lost their release
wiring. Run it before every commit.

## Downloads

Both buttons resolve the newest release asset from the GitHub API when clicked:

- SynergyOS → newest `.apbx` in `Synergy-Tweaks/SynergyOS`
- SynToolkit → newest `.exe` in `Synergy-Tweaks/SynToolkit`

If the API is blocked or rate limited, the button falls back to the hardcoded URL
in `FALLBACK` in `script.js`, which is also the plain `href`, so the link works
with JavaScript off.

### Live release data

On load, `script.js` reads both repos' releases and fills in the version, filename,
size, SHA-256 (from the asset digest) and download counts, including the hero
number. The response is cached in `localStorage` for six hours, so a normal visit
costs no API calls and the per-IP rate limit is not a concern. If the API fails,
the values already in `index.html` stay put — those are the no-JS and offline
fallback, so refresh them occasionally.

### Cutting a release

These are still manual because the API does not carry them:

1. The `FALLBACK` URLs and the version in the `href`s in `index.html` (now only a
   fallback; the live data updates itself).
2. The static values in the cards and hero, used when JavaScript is off.
3. The changelog modal at the bottom of `index.html`, from the release bodies on
   GitHub. Compatibility follows the repo README: Windows 10 22H2 and Windows 11
   22H2–26H2, LTSC included, 26H2 experimental.

## Images

- `images/synergyos-banner.webp` — the banner from the SynergyOS README
- `images/syntoolkit.webp` — SynToolkit running on a SynergyOS desktop
- `images/logo.webp` (256×256) — SynToolkit master logo, used for the hero watermark
- `images/logo-sm.webp` (52×52) — nav and footer
- `images/og.jpg` — 1200×630 social card

Keep the intrinsic sizes in the markup in sync with the files; the page check
enforces that dimensions exist, because missing ones cause layout shift.

## Fonts

Nunito 200–1000 (variable) for headings, Manrope 200–800 for body, Anton 400 for
the footer wordmark. Latin subsets, self-hosted from `fonts/`. No requests leave
the page for fonts. To swap them, replace the woff2 files and the `@font-face`
blocks in `styles.css`.

## Content

Sections, in order: hero, stats, projects, features, SynToolkit dashboard,
screenshots, comparison, downloads, FAQ, final call to action, footer. The
install guide, known issues and changelog live in dialogs at the bottom of
`index.html`; the FAQ is an inline `<details>` accordion.
