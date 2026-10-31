# Synergy Tweaks Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship one fast static page that fronts the Synergy Tweaks org, with SynergyOS as the hero and every project and download reachable.

**Architecture:** Promote `index2.txt` (the most complete existing draft) to `index.html`, split its inline CSS and JS into `styles.css` and `script.js`, add an org-level projects strip and a second download card, and replace the missing screenshot placeholders with real images from the org's READMEs. No framework, no build step.

**Tech Stack:** Static HTML, CSS, vanilla JS, Python 3 + Pillow (asset prep only), Node (assert-based page check).

**Spec:** `docs/superpowers/specs/2026-10-31-synergyos-redesign-design.md`

## Global Constraints

- Three shipped files plus images and fonts: `index.html`, `styles.css`, `script.js`.
- No new runtime dependencies; no build step; must work from `file://` and over HTTP.
- No request to `fonts.googleapis.com` or `fonts.gstatic.com` in the shipped page.
- No reference to `promo*.webp` (they do not exist).
- No hardcoded `SynergyOS.apbx` download URL (the asset is now version-specific).
- Brand: "Synergy Tweaks" in the nav; "SynergyOS" leads the hero.
- Release facts at time of writing: SynergyOS tag `1.7`, asset `SynergyOS.v0.7.apbx`, 20.4 MB. SynToolkit tag `1.7`, asset `SynToolkit-Setup-1.7.0-Stable.exe`, 141 MB.
- Commits: this machine has no git identity, so each task ends with `git add` only. One final commit happens if an identity is configured.
- Canonical link is omitted until the production domain is known.

## Review Focus

- JavaScript blocked or broken: every section must still be visible and every link must still work.
- GitHub API unreachable or rate-limited: the download must still start from a hardcoded fallback.
- 360 px viewport: no horizontal scroll, nav usable, download cards readable.
- Missing or slow image: no layout collapse (explicit width/height, alt text, no empty boxes).
- Stale numbers: version, size and hash must match the release named beside them.

---

### Task 1: Assets — images, OG card, self-hosted fonts

**Files:**
- Create: `images/synergyos-banner.webp`, `images/syntoolkit.webp`, `images/og.jpg`, `images/logo.png`
- Create: `fonts/anton-400.woff2`, `fonts/manrope-400.woff2`, `fonts/manrope-700.woff2`

**Interfaces:**
- Produces: `images/synergyos-banner.webp` (1600×1075), `images/syntoolkit.webp` (1600×912), `images/og.jpg` (1200×630), `images/logo.png` (copied from `playbook.png`), and three woff2 files used by `@font-face` in Task 6.

- [ ] **Step 1: Download the two real images from the org's READMEs**

```powershell
New-Item -ItemType Directory -Force images,fonts | Out-Null
Invoke-WebRequest -UserAgent 'Mozilla/5.0' -UseBasicParsing -OutFile "$env:TEMP\os-banner.jpg" 'https://github.com/user-attachments/assets/750bb727-b4ed-4373-829b-689a9a48df2e'
Invoke-WebRequest -UserAgent 'Mozilla/5.0' -UseBasicParsing -OutFile "$env:TEMP\toolkit.png" 'https://github.com/user-attachments/assets/0f403bcb-0be6-4805-9f7d-3959a9586abe'
Copy-Item playbook.png images/logo.png
```

- [ ] **Step 2: Convert to display sizes with Pillow**

```powershell
@'
from PIL import Image
import os, tempfile
t = tempfile.gettempdir()
img = Image.open(os.path.join(t, "os-banner.jpg")).convert("RGB")
img.resize((1600, round(1600 * img.height / img.width)), Image.LANCZOS).save("images/synergyos-banner.webp", "WEBP", quality=82, method=6)
img.resize((1200, 630), Image.LANCZOS).save("images/og.jpg", "JPEG", quality=86, optimize=True, progressive=True)
tk = Image.open(os.path.join(t, "toolkit.png")).convert("RGB")
tk.resize((1600, round(1600 * tk.height / tk.width)), Image.LANCZOS).save("images/syntoolkit.webp", "WEBP", quality=85, method=6)
'@ | Set-Content -Encoding utf8 "$env:TEMP\mkimg.py"
python "$env:TEMP\mkimg.py"
```

- [ ] **Step 3: Verify dimensions and weight**

Run:
```powershell
python -c "from PIL import Image; [print(p, Image.open(p).size) for p in ['images/synergyos-banner.webp','images/syntoolkit.webp','images/og.jpg']]"
Get-ChildItem images | Select Name,Length
```
Expected: banner 1600 wide, toolkit 1600 wide, og exactly (1200, 630); each webp under 250 KB.

- [ ] **Step 4: Fetch the three woff2 files**

Ask Google Fonts for the CSS with a modern UA, then download each `url(...)` it returns.

```powershell
$ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
$css = (Invoke-WebRequest -UserAgent $ua -UseBasicParsing 'https://fonts.googleapis.com/css2?family=Anton&family=Manrope:wght@400;700&display=swap').Content
$css -split "`n" | Select-String 'font-family|src:'
```
Expected: one `Anton` block and two `Manrope` blocks, each with a `fonts.gstatic.com/...woff2` URL. Download those three into `fonts/` under the names in **Files**.

- [ ] **Step 5: Check the font files are real woff2**

Run: `Get-ChildItem fonts | Select Name,Length` and confirm each file starts with `wOF2`:
```powershell
Get-ChildItem fonts/*.woff2 | ForEach-Object { $_.Name + ' ' + [Text.Encoding]::ASCII.GetString([IO.File]::ReadAllBytes($_.FullName)[0..3]) }
```
Expected: three lines ending in `wOF2`, each file over 10 KB.

- [ ] **Step 6: Stage**

```powershell
git add images fonts
```

---

### Task 2: Promote `index2.txt` and split inline CSS/JS

**Files:**
- Delete: `index.html` (old draft), `synergy-os-website.html`
- Rename: `index2.txt` → `index.html`
- Create: `styles.css`, `script.js`
- Create: `tools/check.mjs`

**Interfaces:**
- Produces: `index.html` with `<link rel="stylesheet" href="styles.css">` and `<script src="script.js" defer></script>`; `styles.css` containing the former `<style>` block verbatim; `script.js` containing the former app `<script>` block. `tools/check.mjs` exits non-zero on a broken page and is reused by every later task.

- [ ] **Step 1: Write the failing page check**

`tools/check.mjs` — regex checks, no dependencies:

```js
import { readFileSync, existsSync } from "node:fs";

const html = readFileSync("index.html", "utf8");
const fail = [];
const must = (ok, msg) => ok || fail.push(msg);

must(!html.includes("fonts.googleapis.com"), "Google Fonts link still present");
must(!html.includes("promo"), "reference to missing promo images");
must(!html.includes("SynergyOS.apbx"), "hardcoded version-specific download asset");
must(!/<style[^>]*>[\s\S]{200,}<\/style>/.test(html), "large inline <style> block still present");
must(/<script src="script\.js" defer><\/script>/.test(html), "deferred script.js reference missing");
must(/<link rel="stylesheet" href="styles\.css">/.test(html), "styles.css reference missing");

for (const m of html.matchAll(/href="#([^"]+)"/g)) {
  must(new RegExp(`id="${m[1]}"`).test(html), `dead anchor: #${m[1]}`);
}
for (const m of html.matchAll(/<img\b[^>]*>/g)) {
  const tag = m[0];
  must(/\balt=/.test(tag), `img without alt: ${tag.slice(0, 60)}`);
  must(/\bwidth=/.test(tag) && /\bheight=/.test(tag), `img without dimensions: ${tag.slice(0, 60)}`);
  const src = tag.match(/src="([^"]+)"/)?.[1];
  if (src && !src.startsWith("http")) must(existsSync(src), `missing local image: ${src}`);
}
for (const f of ["styles.css", "script.js"]) must(existsSync(f), `missing ${f}`);

if (fail.length) { console.error(fail.join("\n")); process.exit(1); }
console.log("page check passed");
```

- [ ] **Step 2: Run it against the current page to see it fail**

Run: `node tools/check.mjs`
Expected: FAIL. Against the old `index.html` this lists the Google Fonts link, the missing `defer`, and dead anchors such as `#about`, `#docs` and `#faq`.

- [ ] **Step 3: Swap the files**

```powershell
git rm index.html synergy-os-website.html
git mv index2.txt index.html
```

- [ ] **Step 4: Extract the style block**

Move everything between `<style>` and `</style>` (line ~48 to ~2270) verbatim into `styles.css`, and replace the block in the HTML with `<link rel="stylesheet" href="styles.css">` in `<head>`.

- [ ] **Step 5: Extract the app script**

Move the `<script>` block that starts after the footer (the one defining `copyHash`, the reveal observer, the count-up, the lightbox, the info modals and the download handler) into `script.js`. Replace it with `<script src="script.js" defer></script>` in the same place. Leave the `<script type="application/ld+json">` block inline in the head. Delete the `static.cloudflareinsights.com` script tag.

- [ ] **Step 6: Serve and eyeball**

```powershell
python -m http.server 8080
```
Open `http://localhost:8080/`. Expected: page renders exactly as before; no console errors; CSS and JS load from local files in the Network tab.

- [ ] **Step 7: Run the page check again**

Run: `node tools/check.mjs`
Expected: still FAIL, but now only on Google Fonts and promo references. Nothing about missing `styles.css`, `script.js`, dead anchors, or image dimensions.

- [ ] **Step 8: Stage**

```powershell
git add -A
```

---

### Task 3: Org framing and projects strip

**Files:**
- Modify: `index.html` (nav, hero eyebrow, new `#projects` section, footer)
- Modify: `styles.css` (`.projects` grid, card styles)

**Interfaces:**
- Produces: `#projects` section with three `.project-card` anchors, one per repo; nav anchor `href="#projects"`. Task 4 links its download buttons to `#download`.

- [ ] **Step 1: Rewrite the nav brand**

Replace `.nav-brand-name` content with `Synergy Tweaks<span class="by">SynergyOS &amp; tools</span>`. Change `.nav-links` to: `Overview` → `#features`, `Projects` → `#projects`, `Preview` → `#preview`, `Download` → `#download`. Keep the `Get SynergyOS` CTA pointing at `#download`. Keep `images/logo.png` as the mark.

- [ ] **Step 2: Add the projects section after the stats section**

```html
<section class="section" id="projects">
  <div class="section-eyebrow">The org</div>
  <h2 class="section-title">Everything we build.</h2>
  <p class="section-lede">Small team, Windows-only tools. All source is public on GitHub.</p>
  <div class="projects">
    <a class="project-card" href="https://github.com/Synergy-Tweaks/SynergyOS">
      <span class="project-tag">Flagship</span>
      <h3>SynergyOS</h3>
      <p>The Windows modification playbook. Pre-tweaked, debloated, privacy-hardened.</p>
      <span class="project-meta">Batchfile · 42 stars</span>
    </a>
    <a class="project-card" href="https://github.com/Synergy-Tweaks/SynToolkit">
      <span class="project-tag">App</span>
      <h3>SynToolkit</h3>
      <p>WinUI 3 control panel for applying tweaks, fetching apps and managing profiles.</p>
      <span class="project-meta">C# · 9 stars</span>
    </a>
    <a class="project-card" href="https://github.com/Synergy-Tweaks/Original-Post-Install">
      <span class="project-tag">Scripts</span>
      <h3>Original Post Install</h3>
      <p>The original post-install batch scripts, kept for reference.</p>
      <span class="project-meta">Batchfile</span>
    </a>
  </div>
</section>
```

- [ ] **Step 3: Style the strip**

Add to `styles.css`: `.projects` as a three-column grid collapsing to one below 860px; `.project-card` as the existing card surface (same background/border/radius as `.stat`), with hover lift already used elsewhere. Do not invent a new palette.

- [ ] **Step 4: Update the footer**

Footer wordmark → `SYNERGY TWEAKS`. Brand block text → `Windows, done right. SynergyOS and the tools around it, built by Kwanteks and Bry1k.` Add a `Projects` column linking the three repos, and keep the existing Resources/Community columns. Point the socials at the org: `https://discord.gg/kwanteks`, `https://x.com/synergyos48`, `https://github.com/Synergy-Tweaks`.

- [ ] **Step 5: Verify the project links resolve**

```powershell
@('https://github.com/Synergy-Tweaks/SynergyOS','https://github.com/Synergy-Tweaks/SynToolkit','https://github.com/Synergy-Tweaks/Original-Post-Install') | ForEach-Object { "$_ " + (Invoke-WebRequest -Method Head -MaximumRedirection 3 -UseBasicParsing $_).StatusCode }
```
Expected: three `200` lines.

- [ ] **Step 6: Check the page**

Run: `node tools/check.mjs`
Expected: no new failures beyond the Google Fonts and promo ones.

- [ ] **Step 7: Stage**

```bash
git add index.html styles.css
```

---

### Task 4: Two download cards with live release resolution

**Files:**
- Modify: `index.html` (`#download` section, `.download-latest` anchors in hero and final CTA)
- Modify: `script.js` (replace the download handler)
- Modify: `styles.css` (`.dl-grid`, second card)

**Interfaces:**
- Produces: `resolveLatestAsset(repo: string, ext: string): Promise<string | null>` in `script.js`; anchors carry `data-repo` (`SynergyOS` / `SynToolkit`) and `data-ext` (`.apbx` / `.exe`). Every download anchor is also a working `href` (the fallback) so middle-click and no-JS still work.

- [ ] **Step 1: Replace the download section body with two cards**

Every download anchor — the hero CTA, the final CTA, and both card buttons — gets `data-repo` and `data-ext` and an `href` set to its fallback URL. Use the existing `.dl-card` markup twice inside a `.dl-grid`. Card 1: eyebrow `Playbook`, title `SynergyOS 1.7`, rows Filename `SynergyOS.v0.7.apbx`, Size `20.4 MB`, Compatibility `Win 10 22H2 / LTSC, Win 11 23H2-25H2`, License `Polyform Non-Commercial`, SHA-256 row with the hash computed in Step 3, button "Download SynergyOS". Card 2: eyebrow `App`, title `SynToolkit 1.7`, rows Filename `SynToolkit-Setup-1.7.0-Stable.exe`, Size `141 MB`, Compatibility `Windows 11 (WinUI 3)`, button "Download SynToolkit". Below both, keep the AME Wizard and Windows 11 secondary links for SynergyOS only, and the existing "Apply via AME Wizard" note.

- [ ] **Step 2: Write the failing check for hardcoded assets**

Add to `tools/check.mjs`:

```js
must((html.match(/data-repo=/g) || []).length >= 4, "download anchors missing data-repo");
must(html.includes("SynergyOS.v0.7.apbx"), "panel does not name the real SynergyOS asset");
must(html.includes("SynToolkit-Setup-1.7.0-Stable.exe"), "panel does not name the real SynToolkit asset");
```

Run: `node tools/check.mjs` → FAIL on `data-repo`.

- [ ] **Step 3: Compute the SynergyOS SHA-256**

```powershell
Invoke-WebRequest -UseBasicParsing -OutFile "$env:TEMP\synergyos.apbx" 'https://github.com/Synergy-Tweaks/SynergyOS/releases/download/1.7/SynergyOS.v0.7.apbx'
(Get-FileHash "$env:TEMP\synergyos.apbx" -Algorithm SHA256).Hash.ToLower()
```
Expected: 64 hex characters. Put it in the SHA row with a comment in the HTML `<!-- hash of 1.7 / SynergyOS.v0.7.apbx -->`.

- [ ] **Step 4: Implement the resolver and click handler**

In `script.js`, replace the `DOWNLOAD_URL` block with:

```js
const FALLBACK = {
  SynergyOS: 'https://github.com/Synergy-Tweaks/SynergyOS/releases/download/1.7/SynergyOS.v0.7.apbx',
  SynToolkit: 'https://github.com/Synergy-Tweaks/SynToolkit/releases/download/1.7/SynToolkit-Setup-1.7.0-Stable.exe',
};

async function resolveLatestAsset(repo, ext) {
  try {
    const res = await fetch(`https://api.github.com/repos/Synergy-Tweaks/${repo}/releases/latest`);
    if (!res.ok) return null;
    const json = await res.json();
    const asset = (json.assets || []).find(a => a.name.toLowerCase().endsWith(ext));
    return asset ? asset.browser_download_url : null;
  } catch {
    return null;
  }
}

document.querySelectorAll('a[data-repo]').forEach(a => {
  a.addEventListener('click', async e => {
    if (e.ctrlKey || e.metaKey || e.button === 1) return;
    e.preventDefault();
    const url = (await resolveLatestAsset(a.dataset.repo, a.dataset.ext)) || FALLBACK[a.dataset.repo];
    if (url) window.location.href = url;
  });
});
```

Set each anchor's `href` to its `FALLBACK` value so the link works with JS off and middle-click.

- [ ] **Step 5: Verify the fallback URLs are real**

```powershell
@('https://github.com/Synergy-Tweaks/SynergyOS/releases/download/1.7/SynergyOS.v0.7.apbx','https://github.com/Synergy-Tweaks/SynToolkit/releases/download/1.7/SynToolkit-Setup-1.7.0-Stable.exe') | ForEach-Object { "$_ " + (Invoke-WebRequest -Method Head -MaximumRedirection 5 -UseBasicParsing $_).StatusCode }
```
Expected: two `200` lines.

- [ ] **Step 6: Verify the resolver in the browser**

With the page served on `localhost:8080`, open the console and run:
```js
await resolveLatestAsset('SynergyOS', '.apbx')
```
Expected: a `github.com/.../releases/download/1.7/SynergyOS.v0.7.apbx` URL.

- [ ] **Step 7: Check, then stage**

Run: `node tools/check.mjs` → PASS.
```bash
git add index.html script.js styles.css
```

- [ ] **Step 8: Verify the fallback when the API is unreachable**

In the browser devtools, block requests to `api.github.com`, reload, then click both card buttons. Expected: both downloads still start, from the `href` fallback. Unblock afterwards.

---

### Task 5: Rebuild the gallery from the two real images

**Files:**
- Modify: `index.html` (`#preview` section)
- Modify: `script.js` (only if the lightbox assumes six items)

**Interfaces:**
- Consumes: `images/synergyos-banner.webp`, `images/syntoolkit.webp` from Task 1.
- Produces: two `.gallery-item.has-image` entries; the existing lightbox finds them by class, so no count is hardcoded.

- [ ] **Step 1: Replace the six placeholder tiles with two real ones**

```html
<div class="gallery-item has-image">
  <img src="images/synergyos-banner.webp" alt="SynergyOS banner artwork" width="1600" height="1075" loading="lazy" decoding="async" />
  <span class="gallery-tag">SynergyOS</span>
</div>
<div class="gallery-item has-image">
  <img src="images/syntoolkit.webp" alt="SynToolkit running on a SynergyOS desktop" width="1600" height="912" loading="lazy" decoding="async" />
  <span class="gallery-tag">SynToolkit on SynergyOS</span>
</div>
```
Adjust the lede to "What it looks like." and delete every `promo*.webp` reference.

- [ ] **Step 2: Check the lightbox with two images**

Serve, open the page, click each tile, use the arrow keys, close with Escape.
Expected: opens on the clicked image, arrows cycle between the two, zoom and pan still work, Escape closes and resets zoom.

- [ ] **Step 3: Verify both images actually load**

In the console: `[...document.querySelectorAll('.gallery-item img')].map(i => i.naturalWidth)`
Expected: `[1600, 1600]`.

- [ ] **Step 4: Run the check and stage**

`node tools/check.mjs` → PASS.
```bash
git add index.html script.js
```

---

### Task 6: Performance — fonts, reveal, paint cost

**Files:**
- Modify: `index.html` (head, reveal markup unchanged)
- Modify: `styles.css` (`@font-face`, reveal fallback, mobile blur, content-visibility)

**Interfaces:**
- Consumes: `fonts/anton-400.woff2`, `fonts/manrope-400.woff2`, `fonts/manrope-700.woff2` from Task 1.
- Produces: `body` font stack starting with `'Manrope'`; headings `'Anton'`; `--mono` resolves to the system stack.

- [ ] **Step 1: Add `@font-face` and preloads**

In `styles.css`:

```css
@font-face { font-family: 'Anton'; src: url('fonts/anton-400.woff2') format('woff2'); font-weight: 400; font-display: swap; }
@font-face { font-family: 'Manrope'; src: url('fonts/manrope-400.woff2') format('woff2'); font-weight: 400; font-display: swap; }
@font-face { font-family: 'Manrope'; src: url('fonts/manrope-700.woff2') format('woff2'); font-weight: 700; font-display: swap; }
```

In `<head>`, delete the three Google Fonts tags and add:

```html
<link rel="preload" href="fonts/anton-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="fonts/manrope-400.woff2" as="font" type="font/woff2" crossorigin>
```

Replace every `font-family: 'JetBrains Mono', monospace` with `font-family: var(--mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace)` and set `--mono` accordingly on `:root`.

- [ ] **Step 2: Make reveal fail safe**

In `script.js`, wrap the reveal setup:

```js
if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.querySelectorAll('.section, .dash-section, .cta-final, .warning-strip').forEach(el => {
    el.classList.add('reveal');
    obs.observe(el);
  });
}
```

And in `styles.css` add the escape hatch:

```css
@media (prefers-reduced-motion: reduce) { .reveal { opacity: 1; transform: none; } }
```

- [ ] **Step 3: Cut paint cost on small screens**

In the `max-width: 860px` block: set `backdrop-filter: none` on the nav and any `.dp-*` chrome that uses it, and reduce the hero watermark/glow blur to 24px or less. Add `content-visibility: auto; contain-intrinsic-size: 1px 900px;` to `.section`, `.dash-section`, `.cta-final`.

- [ ] **Step 4: Check no external font or beacon request remains**

```powershell
Select-String -Path index.html,styles.css -Pattern 'googleapis|gstatic|cloudflareinsights'
```
Expected: no output. Then `node tools/check.mjs` → PASS.

- [ ] **Step 5: Measure**

Serve, then run Lighthouse on mobile:
`tools.browser.lighthouse` against `http://localhost:8080/`, category performance.
Expected: performance ≥ 95, LCP < 1.5 s, CLS < 0.05. If below, fix the largest finding before moving on (usually an oversized image or a blocking script).

- [ ] **Step 6: Stage**

```bash
git add index.html styles.css script.js
```

---

### Task 7: Mobile nav, accessibility, metadata

**Files:**
- Modify: `index.html` (nav, head)
- Modify: `styles.css` (nav disclosure, focus rings)
- Modify: `script.js` (close menu on link click)

**Interfaces:**
- Produces: `<details class="nav-menu">` shown below 860px, `.nav-links` hidden there; `:focus-visible` ring using the existing accent colour.

- [ ] **Step 1: Add the disclosure nav**

```html
<details class="nav-menu">
  <summary aria-label="Open menu">Menu</summary>
  <div class="nav-menu-links">
    <a href="#features">Overview</a>
    <a href="#projects">Projects</a>
    <a href="#preview">Preview</a>
    <a href="#download">Download</a>
  </div>
</details>
```
Place it after `.nav-links`. CSS: `.nav-menu { display: none; }` and inside the existing 860px query: `.nav-links { display: none; } .nav-menu { display: block; }`, with `summary` styled as a button and `.nav-menu-links` as a full-width dropdown panel.

- [ ] **Step 2: Close the menu after a jump**

In `script.js`:

```js
document.querySelectorAll('.nav-menu-links a').forEach(a =>
  a.addEventListener('click', () => a.closest('details').removeAttribute('open'))
);
```

- [ ] **Step 3: Add focus styles and dialog semantics**

`styles.css`: `:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }` and remove any `outline: none` that wins over it. On `.info-modal` and `#lightbox`, add `role="dialog"` `aria-modal="true"` `aria-label`, and `aria-hidden="true"` toggled with the `is-open` class in `script.js`.

- [ ] **Step 4: Metadata**

Replace the title with `Synergy Tweaks — SynergyOS, SynToolkit and Windows tools`. Add:

```html
<meta name="description" content="SynergyOS is a debloated, privacy-hardened Windows playbook for gamers. SynToolkit is its WinUI 3 control panel. Free, open source, no account.">
<meta property="og:title" content="Synergy Tweaks — SynergyOS">
<meta property="og:description" content="A debloated, privacy-hardened Windows playbook for gamers, plus the toolkit that drives it.">
<meta property="og:image" content="images/og.jpg">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
```
Leave the existing favicon and JSON-LD as they are; update the JSON-LD `name` to `Synergy Tweaks`.

- [ ] **Step 5: Verify at 360px**

Resize the page to 360×800 (`tools["chrome-devtools"].resize_page`). Expected: no horizontal scrollbar (`document.documentElement.scrollWidth <= 360`), menu opens, links jump and the menu closes, both download cards readable without clipping.

- [ ] **Step 6: Accessibility check**

Run Lighthouse accessibility. Expected: ≥ 95. Fix every serious finding (contrast, missing label, non-focusable control).

- [ ] **Step 7: Stage**

```bash
git add index.html styles.css script.js
```

---

### Task 8: Full verification and README truth-up

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-10-31-synergyos-redesign-design.md` (only if a decision changed)

**Interfaces:**
- Consumes: everything above.

- [ ] **Step 1: No-JS render**

Disable JavaScript in the browser (or load with `chrome-devtools` request blocking for `script.js`) and reload. Expected: all sections visible, nav links jump, both download buttons point to the release URLs and start downloads.

- [ ] **Step 2: Desktop and mobile Lighthouse**

Run both, record scores. Expected: performance ≥ 95, accessibility ≥ 95, best-practices ≥ 95, SEO ≥ 95. Any score below is a bug to fix, not a number to explain away.

- [ ] **Step 3: Link and asset audit**

```powershell
node tools/check.mjs
```
Then click every nav, footer, project and download link once. Expected: no 404, no dead anchor, no console error.

- [ ] **Step 4: Rewrite the README to match reality**

The current README documents the old three-file page, a logo drag-and-drop placeholder and sections that no longer exist. Replace the file structure, the feature list and the "how to use" steps with what now ships: `index.html`, `styles.css`, `script.js`, `images/`, `fonts/`, `tools/check.mjs`; how to serve locally; how releases are resolved; and the "update the version/size/hash when releasing" note.

- [ ] **Step 5: Stage, and commit if an identity exists**

```bash
git add -A
```

Then check the identity:

```powershell
git config user.name
git config user.email
```

If both print a value, commit with `git commit -m "Rebuild site for the Synergy Tweaks org"`. If not, stop after staging and tell the owner.
