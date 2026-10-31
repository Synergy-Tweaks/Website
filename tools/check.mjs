import { readFileSync, existsSync } from "node:fs";

const raw = readFileSync("index.html", "utf8");
const html = raw.replace(/<!--[\s\S]*?-->/g, "");
const fail = [];
const must = (ok, msg) => ok || fail.push(msg);

must(!html.includes("fonts.googleapis.com"), "Google Fonts link still present");
must(!html.includes("fonts.gstatic.com"), "Google Fonts font file still referenced");
must(!html.includes("cloudflareinsights"), "Cloudflare beacon still present");
must(!html.includes("promo"), "reference to missing promo images");
must(!html.includes("SynergyOS.apbx"), "hardcoded version-specific download asset");
must(!/<style[^>]*>[\s\S]{200,}<\/style>/.test(html), "large inline <style> block still present");
must(/<script src="script\.js(\?[^"]*)?" defer><\/script>/.test(html), "deferred script.js reference missing");
must(/<link rel="stylesheet" href="styles\.css(\?[^"]*)?">/.test(html), "styles.css reference missing");
must(/<main[\s>]/.test(html), "missing <main> landmark");
must(!/\breveal\b/.test(html), "content hidden by default via .reveal");
must((html.match(/data-repo=/g) || []).length >= 4, "download anchors missing data-repo");
must(html.includes("SynergyOS.v0.7.apbx"), "panel does not name the real SynergyOS asset");
must(html.includes("SynToolkit-Setup-1.7.0-Stable.exe"), "panel does not name the real SynToolkit asset");
const js = readFileSync("script.js", "utf8");
must(!js.includes("kwanteks/SynergyOS"), "script.js still points at the old org");
must(/function resolveLatestAsset/.test(js), "release resolver missing from script.js");

for (const m of html.matchAll(/href="#([^"]+)"/g)) {
  must(new RegExp(`id="${m[1]}"`).test(html), `dead anchor: #${m[1]}`);
}
for (const m of html.matchAll(/<img\b[^>]*>/g)) {
  const tag = m[0];
  must(/\balt=/.test(tag), `img without alt: ${tag.slice(0, 60)}`);
  const src = tag.match(/src="([^"]+)"/)?.[1];
  if (!src || src.startsWith("data:")) continue;
  must(/\bwidth=/.test(tag) && /\bheight=/.test(tag), `img without dimensions: ${tag.slice(0, 60)}`);
  if (!src.startsWith("http")) must(existsSync(src), `missing local image: ${src}`);
}
for (const f of ["styles.css", "script.js"]) must(existsSync(f), `missing ${f}`);

// tag balance: catch the unclosed <div> class of bug
const VOID = new Set(["area","base","br","col","embed","hr","img","input","link","meta","source","track","wbr"]);
const stack = [];
for (const m of html.matchAll(/<(\/?)([a-zA-Z][a-zA-Z0-9-]*)([^>]*)>/g)) {
  const [, close, rawName, attrs] = m;
  const name = rawName.toLowerCase();
  if (VOID.has(name) || attrs.trim().endsWith("/")) continue;
  if (!close) { stack.push(name); continue; }
  const open = stack.pop();
  if (open !== name) { fail.push(`unbalanced tag: </${name}> closes <${open}>`); break; }
}
if (stack.length) fail.push(`unclosed tags: ${stack.join(", ")}`);

// local links must point at files that exist
for (const m of html.matchAll(/href="([^"]+)"/g)) {
  const href = m[1];
  if (href.startsWith("#") || href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("data:")) continue;
  must(existsSync(href.split("?")[0]), `local link missing: ${href}`);
}

// release metadata sanity
const hash = html.match(/data-field="sha"[^>]*>([0-9a-f]+)</)?.[1] || "";
must(/^[0-9a-f]{64}$/.test(hash), "SHA-256 row is not a 64-char hex digest");
must((html.match(/data-field="/g) || []).length >= 10, "release data hooks missing");
must(/SynergyOS 1\.7|>1\.7</.test(html), "page does not show the current SynergyOS version");

if (fail.length) {
  console.error(fail.join("\n"));
  process.exit(1);
}
console.log("page check passed");
