/* Build data/releases.json from the public GitHub releases.
   Runs in CI on a schedule (or by hand) so the site has a local snapshot:
   version, size, SHA-256, download count, link and release notes.

   Usage: node tools/fetch-releases.mjs
   Optional: GITHUB_TOKEN for a higher rate limit. */

import { writeFileSync, mkdirSync } from "node:fs";

const ORG = "Synergy-Tweaks";
const REPOS = {
  SynergyOS: { ext: ".apbx" },
  SynToolkit: { ext: ".exe" },
};
const token = process.env.GITHUB_TOKEN || "";
const headers = { Accept: "application/vnd.github+json", "User-Agent": "synergy-site" };
if (token) headers.Authorization = `Bearer ${token}`;

async function get(url) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function snapshot(repo, ext) {
  const releases = await get(`https://api.github.com/repos/${ORG}/${repo}/releases?per_page=100`);
  const latest = releases.find((r) => !r.draft && !r.prerelease) || releases[0];
  if (!latest) throw new Error(`${repo}: no releases`);
  const asset =
    (latest.assets || []).find((a) => a.name.toLowerCase().endsWith(ext)) ||
    (latest.assets || [])[0];
  if (!asset) throw new Error(`${repo}: latest release has no asset`);

  return {
    tag: latest.tag_name,
    name: latest.name || latest.tag_name,
    published: latest.published_at,
    url: latest.html_url,
    notes: latest.body || "",
    filename: asset.name,
    size: asset.size,
    sha: asset.digest ? String(asset.digest).replace(/^sha256:/, "") : "",
    download: `https://github.com/${ORG}/${repo}/releases/latest/download/${asset.name}`,
  };
}

const out = {};
for (const [repo, { ext }] of Object.entries(REPOS)) {
  out[repo] = await snapshot(repo, ext);
  console.log(repo, out[repo].tag, out[repo].filename, out[repo].size, out[repo].sha.slice(0, 12));
}

mkdirSync("data", { recursive: true });
writeFileSync("data/releases.json", JSON.stringify(out, null, 2) + "\n");
console.log("wrote data/releases.json");
