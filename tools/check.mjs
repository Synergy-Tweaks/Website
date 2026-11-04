import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const fail = [];
const must = (ok, msg) => ok || fail.push(msg);

const pages = readdirSync(".").filter((f) => f.endsWith(".html"));
must(pages.includes("index.html"), "index.html missing");
must(pages.includes("synergyos.html"), "synergyos.html missing");
must(pages.includes("syntoolkit.html"), "syntoolkit.html missing");
must(pages.includes("docs.html"), "docs.html missing");
must(pages.includes("about.html"), "about.html missing");
must(pages.includes("privacy.html"), "privacy.html missing");
must(pages.includes("credits.html"), "credits.html missing");

must(existsSync("styles.css"), "styles.css missing");
must(existsSync("js/config.js"), "js/config.js missing");
must(existsSync("js/main.js"), "js/main.js missing");
must(existsSync("data/changelog.json"), "data/changelog.json missing");
must(existsSync("data/known-issues.json"), "data/known-issues.json missing");
must(existsSync("robots.txt"), "robots.txt missing");
must(existsSync("sitemap.xml"), "sitemap.xml missing");
must(!existsSync("script.js"), "legacy script.js should be removed");

const config = readFileSync("js/config.js", "utf8");
const discordMatch = config.match(/discord:\s*'([^']+)'/);
must(discordMatch, "DISCORD missing from js/config.js");
const DISCORD = discordMatch ? discordMatch[1] : "";

const VOID = new Set(["area","base","br","col","embed","hr","img","input","link","meta","source","track","wbr"]);

for (const page of pages) {
  const raw = readFileSync(page, "utf8");
  const html = raw.replace(/<!--[\s\S]*?-->/g, "");

  must(!html.includes("fonts.googleapis.com"), `${page}: Google Fonts link`);
  must(!html.includes("cloudflareinsights"), `${page}: Cloudflare beacon`);
  must(!html.includes("Happy holidays"), `${page}: Christmas leftover`);
  must(!html.includes("class=\"snow\""), `${page}: snow leftover`);
  must(!/\bfsos\b/i.test(html), `${page}: FSOS leftover class/copy`);
  must(/<main[\s>]/.test(html), `${page}: missing <main>`);
  must((html.match(/<h1[\s>]/g) || []).length === 1, `${page}: need exactly one h1`);
  must(html.includes('name="description"'), `${page}: missing meta description`);
  must(html.includes("og:title"), `${page}: missing og:title`);
  must(html.includes("theme-color"), `${page}: missing theme-color`);
  must(html.includes('rel="canonical"'), `${page}: missing canonical`);
  must(/styles\.css(\?[^"]*)?/.test(html), `${page}: styles.css missing`);
  must(/js\/main\.js(\?[^"]*)?/.test(html), `${page}: js/main.js missing`);
  must(html.includes("js/config.js"), `${page}: js/config.js missing`);
  must(html.includes("skip-link"), `${page}: missing skip link`);

  // Discord must only be the config value
  for (const m of html.matchAll(/https:\/\/(?:discord\.gg|dsc\.gg)\/[A-Za-z0-9-]+/g)) {
    must(m[0] === DISCORD, `${page}: Discord URL ${m[0]} != config ${DISCORD}`);
  }

  // External links with target=_blank need noopener
  for (const m of html.matchAll(/<a\b[^>]*>/g)) {
    const tag = m[0];
    if (/target="_blank"/.test(tag)) {
      must(/rel="[^"]*noopener noreferrer[^"]*"/.test(tag), `${page}: target=_blank without noopener: ${tag.slice(0, 80)}`);
    }
  }

  // Anchors
  for (const m of html.matchAll(/href="#([^"]+)"/g)) {
    const id = m[1];
    if (!id) continue;
    must(new RegExp(`id="${id}"`).test(html), `${page}: dead anchor #${id}`);
  }

  // Images
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    const tag = m[0];
    must(/\balt=/.test(tag), `${page}: img without alt: ${tag.slice(0, 60)}`);
    const src = tag.match(/src="([^"]+)"/)?.[1];
    if (!src || src.startsWith("data:") || src.startsWith("http")) continue;
    must(/\bwidth=/.test(tag) && /\bheight=/.test(tag), `${page}: img without dimensions: ${tag.slice(0, 60)}`);
    must(existsSync(src), `${page}: missing image ${src}`);
  }

  // Local href files
  for (const m of html.matchAll(/href="([^"]+)"/g)) {
    const href = m[1];
    if (href.startsWith("#") || href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("data:")) continue;
    const file = href.split("#")[0].split("?")[0];
    if (!file) continue;
    must(existsSync(file), `${page}: local link missing: ${href}`);
  }

  // Tag balance
  const stack = [];
  for (const m of html.matchAll(/<(\/?)([a-zA-Z][a-zA-Z0-9-]*)([^>]*)>/g)) {
    const [, close, rawName, attrs] = m;
    const name = rawName.toLowerCase();
    if (VOID.has(name) || attrs.trim().endsWith("/")) continue;
    if (!close) { stack.push(name); continue; }
    const open = stack.pop();
    if (open !== name) {
      fail.push(`${page}: unbalanced tag </${name}> closes <${open}>`);
      break;
    }
  }
  if (stack.length) fail.push(`${page}: unclosed tags: ${stack.join(", ")}`);
}

const js = readFileSync("js/main.js", "utf8");
must(!js.includes("kwanteks/SynergyOS"), "main.js still points at old org path");
must(/resolveLatestDownload|latestDownloadUrl/.test(js), "release resolver missing");
must(!/releases\/download\/\d/.test(readFileSync("js/config.js", "utf8")), "version-pinned download in config");
must(
  !pages.some((p) => /releases\/download\/[^l]/.test(readFileSync(p, "utf8"))),
  "version-pinned download href in HTML"
);

const index = readFileSync("index.html", "utf8");
must(!index.includes("MOCK-DATA") && !index.includes("Sample figures"), "stale comparison sample-data markers on home");
must(/2\.8 GB/.test(index) && /2\.0 GB/.test(index), "comparison RAM figures missing from home");
must(/controlled/.test(index) && /drivers installed/.test(index), "comparison disclaimers missing from home");
must(!/1200\+|Real FPS|turbo-charged|Happy holidays/i.test(index), "hype or holiday leftovers on home");

if (fail.length) {
  console.error(fail.join("\n"));
  process.exit(1);
}
console.log(`page check passed (${pages.length} html files)`);
