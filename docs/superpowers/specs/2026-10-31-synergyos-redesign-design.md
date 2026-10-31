# Synergy Tweaks site: performance + UI pass

Status: implemented.
Date: 2026-10-31. Rev 2: scope is the GitHub org, not just SynergyOS.
Rev 3: the visual language follows mcsv.me — warm plum background, cream sticker
cards, emerald 3D buttons, Nunito headings, inline FAQ. Structure is unchanged.

## Intent

One page that fronts the Synergy Tweaks org: SynergyOS as the flagship, SynToolkit
alongside it, the smaller repos linked. It should load fast and feel as considered
as mcsv.me, while keeping the dark purple gaming identity. Build on the best
existing version of the page instead of writing a fourth.

## Goals

- First view visible in under ~1.5s on a mid-range phone; no layout shift when
  animations run.
- All content visible when JavaScript is slow, broken, or off.
- Every project reachable and every download resolves the actual current release.
- Navigation usable at 360px wide.
- One page file to maintain, no build step, no dependencies.

## Non-goals

- A framework or build pipeline (Astro was considered and rejected).
- New mascot or illustration art.
- A docs hub or one page per project.
- Analytics.
- Rewriting the copy.

## Anti-goals

Empty placeholder tiles, content hidden until scroll, dead buttons, stale version or
size numbers, a project nobody can click.

## Constraints

Static files served as-is, works from `file://`, three files plus images, edited on
Windows.

## Approaches

- **A — tune the current `index.html`.** Cheapest, but keeps the weaker layout and
  dead sections.
- **B — adopt the best existing version and fix it.** Chosen.
- **C — Astro + components.** Right only when pages multiply; overhead today.

## What we found

- The org is Synergy Tweaks, five repos: **SynergyOS** (playbook, 42 stars),
  **SynToolkit** (C# WinUI 3 app, 9 stars), **Original-Post-Install** (no releases),
  `.github`, and a fork. Org links: Discord, X, email.
- SynergyOS release: tag `1.7`, asset `SynergyOS.v0.7.apbx`, 20.4 MB.
  SynToolkit release: `1.7`, asset `SynToolkit-Setup-1.7.0-Stable.exe`, 141 MB.
  The page links `SynergyOS.apbx` and claims R5 / 97.6 MB, so the primary download
  is a 404 and the panel numbers are wrong.
- Real art does exist: a SynergyOS metallic banner (3736×2508 JPEG) and a SynToolkit
  screenshot on a SynergyOS desktop (1919×1094 PNG), both in the repo READMEs.
  So the gallery is not dead; it can be rebuilt from those two.
- `index2.txt` is the most complete version of the page: real copy, copy-SHA
  control, CSS-built "Dash" mockup, count-up stats, lightbox, info modals, JSON-LD.
  `index.html` and `synergy-os-website.html` are older drafts.
- Fonts: three families, Manrope at six weights, from Google Fonts, no preload.
- 46 KB of inline CSS and inline JS, so nothing is cached between visits.
- No mobile menu, no meta description, no OG tags, no canonical link.

## Decisions made together

- Option B: adopt the best existing page and fix it in place.
- The site is the org's front door, not a single-product page.
- The hero leads with SynergyOS: product first, org name in the nav, projects below.

## My calls (check these)

1. `index2.txt` becomes `index.html`; the other two copies are deleted. Git history
   keeps them.
2. Navigation: Synergy Tweaks brand, links to Projects, SynergyOS, Downloads, GitHub.
   Footer credits Kwanteks and Bry1k.
3. Hero stays product-led on SynergyOS, with the org name in the nav and a projects
   strip doing the job mcsv.me's pricing grid does.
4. Downloads section becomes two cards: SynergyOS and SynToolkit, each resolving the
   latest release through the GitHub API at click, with a hardcoded fallback.
5. Panel metadata comes from the releases (tag, size). SHA-256 is computed once from
   the asset and hardcoded with the release tag beside it.
6. Gallery rebuilt from the two real images, converted to WebP with width/height set
   and lazy loading. No empty boxes, nothing invented.
7. Fonts: Anton plus Manrope 400/700, self-hosted woff2 and preloaded. Mono falls
   back to the system stack.
8. CSS moves to `styles.css` and JS to `script.js` (deferred). No minifier: it
   would add a build step to save ~2 KB after gzip. The Cloudflare beacon is
   dropped unless the site is on Cloudflare.
9. Scroll reveal keeps content visible by default; it animates only when JS and
   IntersectionObserver exist, and honours `prefers-reduced-motion`.
10. Mobile navigation is a native `<details>` disclosure, no dependency.
11. Meta description, OG/Twitter tags, canonical, and a 1200×630 OG image from the
    SynergyOS banner.
12. Accessibility: visible focus rings, dialog semantics on modals and lightbox,
    labelled controls, reduced motion.

## Left to the builder

Spacing and type scale, breakpoints, whether lightbox panning stays on touch, copy
for the projects strip, and Lighthouse tuning.

## Verification

- Lighthouse mobile and desktop: performance and accessibility at 95 or better.
- Page renders fully with JS disabled.
- Both resolved download URLs return 200 with the expected size.
- 360px screenshot: menu opens, no horizontal scroll.
- Every CTA and every project link clicked once.

## Size

One page, three files, one day. No new dependencies.
