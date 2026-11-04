(function () {
  const SITE = window.SITE || {};

  /* Apply config hrefs where marked */
  document.querySelectorAll('[data-link]').forEach((el) => {
    const key = el.getAttribute('data-link');
    const map = {
      discord: SITE.discord,
      youtube: SITE.youtube,
      twitter: SITE.twitter,
      org: SITE.orgUrl,
      ame: SITE.ameWizard,
      windows11: SITE.windows11,
      synergyos: SITE.repos && SITE.repos.SynergyOS && SITE.repos.SynergyOS.url,
      syntoolkit: SITE.repos && SITE.repos.SynToolkit && SITE.repos.SynToolkit.url,
      'synergyos-releases': SITE.repos && SITE.repos.SynergyOS && SITE.repos.SynergyOS.releases,
      'syntoolkit-releases': SITE.repos && SITE.repos.SynToolkit && SITE.repos.SynToolkit.releases,
      opi: SITE.repos && SITE.repos.OriginalPostInstall && SITE.repos.OriginalPostInstall.url,
    };
    if (map[key]) el.setAttribute('href', map[key]);
  });

  /* Sticky nav state */
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* Close mobile menu on navigate */
  document.querySelectorAll('.nav-menu-panel a, .nav-ext a').forEach((a) => {
    a.addEventListener('click', () => {
      const menu = document.querySelector('.nav-menu');
      if (menu) menu.removeAttribute('open');
    });
  });

  /* Scroll reveal */
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll('.reveal').forEach((el) => obs.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
  }

  /* Copy SHA */
  document.querySelectorAll('[data-copy-hash]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const target = document.querySelector(btn.getAttribute('data-copy-hash'));
      const text = (target ? target.textContent : '').trim();
      if (!text) return;
      const done = () => {
        btn.textContent = 'Copied';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = 'Copy';
          btn.classList.remove('copied');
        }, 1600);
      };
      try {
        await navigator.clipboard.writeText(text);
        done();
      } catch {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand('copy');
          done();
        } catch {
          btn.textContent = 'Select & copy';
        }
        ta.remove();
      }
    });
  });

  /* Release hydrate + download resolve.
     Never use /releases/download/TAG/... in href — that looks version-pinned.
     Prefer GitHub's permanent /releases/latest/download/ASSET redirect. */
  const CACHE_KEY = 'synergy-releases-v3';
  const TTL = 60 * 60 * 1000;
  const REPOS = ['SynergyOS', 'SynToolkit'];

  function latestDownloadUrl(repo, filename) {
    if (!filename) return SITE.repos?.[repo]?.fallback || SITE.repos?.[repo]?.latest || '';
    return `https://github.com/Synergy-Tweaks/${repo}/releases/latest/download/${encodeURIComponent(filename)}`;
  }

  function readCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed.ts || Date.now() - parsed.ts > TTL) return null;
      return parsed.data;
    } catch {
      return null;
    }
  }

  function writeCache(data) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
    } catch {}
  }

  function formatSize(bytes) {
    const mb = bytes / 1e6;
    return (mb >= 100 ? Math.round(mb) : mb.toFixed(1)) + ' MB';
  }

  async function loadSnapshot() {
    try {
      const res = await fetch('data/releases.json', { cache: 'no-store' });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  async function fetchRepoRelease(repo) {
    const res = await fetch(
      `https://api.github.com/repos/Synergy-Tweaks/${repo}/releases?per_page=100`
    );
    if (!res.ok) throw new Error(String(res.status));
    const releases = await res.json();
    const latest = releases.find((r) => !r.draft && !r.prerelease) || releases[0];
    if (!latest) throw new Error('no releases');
    const ext = SITE.repos?.[repo]?.ext || '';
    const preferred = SITE.repos?.[repo]?.asset;
    const asset =
      (preferred && (latest.assets || []).find((a) => a.name === preferred)) ||
      (latest.assets || []).find((a) => a.name.toLowerCase().endsWith(ext)) ||
      (latest.assets || [])[0];
    const downloads = releases.reduce(
      (sum, r) => sum + (r.assets || []).reduce((s, a) => s + (a.download_count || 0), 0),
      0
    );
    const filename = asset ? asset.name : preferred || '';
    return {
      tag: latest.tag_name,
      filename,
      size: asset ? asset.size : 0,
      sha: asset && asset.digest ? String(asset.digest).replace(/^sha256:/, '') : '',
      downloads,
      download: latestDownloadUrl(repo, filename),
    };
  }

  function applyReleaseData(data) {
    document.querySelectorAll('[data-release][data-field]').forEach((el) => {
      const info = data[el.dataset.release];
      if (!info) return;
      switch (el.dataset.field) {
        case 'version':
          el.textContent = info.tag;
          break;
        case 'filename':
          if (info.filename) el.textContent = info.filename;
          break;
        case 'size':
          if (info.size) el.textContent = formatSize(info.size);
          break;
        case 'downloads':
          if (Number.isFinite(info.downloads)) {
            el.textContent = Number(info.downloads).toLocaleString('en-US');
            el.dataset.filled = '1';
          }
          break;
        case 'sha':
          if (info.sha) el.textContent = info.sha;
          break;
      }
    });

    document.querySelectorAll('.hero-downloads').forEach((wrap) => {
      const value = wrap.querySelector('[data-field="downloads"]');
      if (value && value.dataset.filled === '1') {
        wrap.classList.add('is-ready');
      }
    });

    document.querySelectorAll('a[data-repo]').forEach((a) => {
      const info = data[a.dataset.repo];
      const href =
        info?.download ||
        latestDownloadUrl(a.dataset.repo, SITE.repos?.[a.dataset.repo]?.asset) ||
        SITE.repos?.[a.dataset.repo]?.fallback;
      if (href) a.setAttribute('href', href);
    });
  }

  async function loadReleaseData() {
    let data = readCache();
    if (!data) {
      try {
        const entries = await Promise.all(REPOS.map(fetchRepoRelease));
        data = Object.fromEntries(REPOS.map((repo, i) => [repo, entries[i]]));
        writeCache(data);
      } catch {
        data = await loadSnapshot();
        if (!data) return;
      }
    }
    applyReleaseData(data);
  }

  async function resolveLatestDownload(repo, ext) {
    const cached = readCache();
    if (cached?.[repo]?.download) return cached[repo].download;
    const configured = SITE.repos?.[repo]?.asset;
    if (configured) return latestDownloadUrl(repo, configured);
    try {
      const res = await fetch(
        `https://api.github.com/repos/Synergy-Tweaks/${repo}/releases/latest`,
        {
          signal:
            typeof AbortSignal !== 'undefined' && AbortSignal.timeout
              ? AbortSignal.timeout(3000)
              : undefined,
        }
      );
      if (!res.ok) return null;
      const json = await res.json();
      const asset = (json.assets || []).find((a) => a.name.toLowerCase().endsWith(ext));
      return asset ? latestDownloadUrl(repo, asset.name) : null;
    } catch {
      return null;
    }
  }

  document.querySelectorAll('a[data-repo]').forEach((a) => {
    /* Seed unpinned href immediately when asset name is known */
    const seed = SITE.repos?.[a.dataset.repo]?.asset;
    if (seed) a.setAttribute('href', latestDownloadUrl(a.dataset.repo, seed));

    a.addEventListener('click', async (e) => {
      if (e.ctrlKey || e.metaKey || e.button === 1) return;
      e.preventDefault();
      const url =
        (await resolveLatestDownload(a.dataset.repo, a.dataset.ext)) ||
        SITE.repos?.[a.dataset.repo]?.fallback;
      if (url) window.location.href = url;
    });
  });

  if (document.querySelector('[data-release], a[data-repo]')) loadReleaseData();

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* Lightweight markdown → HTML for GitHub release bodies */
  function renderReleaseBody(md) {
    if (!md) return '<p class="changelog-empty">No release notes.</p>';
    const text = String(md).replace(/\r\n/g, '\n').trim();
    const parts = [];
    const chunks = text.split(/(```[\s\S]*?```)/g);

    chunks.forEach((chunk) => {
      if (chunk.startsWith('```')) {
        const inner = chunk.replace(/^```[a-zA-Z0-9_-]*\n?/, '').replace(/```$/, '');
        parts.push(`<pre class="changelog-pre"><code>${escapeHtml(inner.trimEnd())}</code></pre>`);
        return;
      }

      const formatInline = (s) =>
        escapeHtml(s)
          .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
          .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
          .replace(/`([^`]+)`/g, '<code>$1</code>');

      const lines = chunk.split('\n');
      let list = [];
      const flushList = () => {
        if (!list.length) return;
        parts.push(`<ul>${list.map((li) => `<li>${li}</li>`).join('')}</ul>`);
        list = [];
      };

      lines.forEach((raw) => {
        const trimmed = raw.trim();
        if (!trimmed) {
          flushList();
          return;
        }

        const bullet = trimmed.match(/^(?:>\s*)?(?:[-*+]|\d+\.)\s+(.*)$/);
        if (bullet) {
          list.push(formatInline(bullet[1]));
          return;
        }

        flushList();
        const heading = trimmed.match(/^(#{1,3})\s+(.*)$/);
        if (heading) {
          const title = formatInline(heading[2].replace(/[\u{1F300}-\u{1FAFF}]/gu, '').trim());
          if (title) parts.push(`<h4 class="changelog-sub">${title}</h4>`);
          return;
        }

        parts.push(`<p>${formatInline(trimmed)}</p>`);
      });
      flushList();
    });

    return parts.join('') || '<p class="changelog-empty">No release notes.</p>';
  }

  function formatReleaseDate(iso) {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  }

  const CHANGELOG_CACHE = 'synergy-changelog-v2';
  const CHANGELOG_TTL = 60 * 60 * 1000;

  function readChangelogCache(repo) {
    try {
      const raw = localStorage.getItem(`${CHANGELOG_CACHE}:${repo}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed.ts || Date.now() - parsed.ts > CHANGELOG_TTL) return null;
      return parsed.data;
    } catch {
      return null;
    }
  }

  function writeChangelogCache(repo, data) {
    try {
      localStorage.setItem(
        `${CHANGELOG_CACHE}:${repo}`,
        JSON.stringify({ ts: Date.now(), data })
      );
    } catch {}
  }

  async function fetchRepoChangelogs(repo, limit) {
    const cached = readChangelogCache(repo);
    if (cached) return cached;
    let releases;
    try {
      const res = await fetch(
        `https://api.github.com/repos/Synergy-Tweaks/${repo}/releases?per_page=${limit}`
      );
      if (!res.ok) throw new Error(String(res.status));
      releases = await res.json();
    } catch (err) {
      const snap = await loadSnapshot();
      const entry = snap && snap[repo];
      if (!entry) throw err;
      releases = [
        { tag_name: entry.tag, name: entry.name, published_at: entry.published, prerelease: false, body: entry.notes, html_url: entry.url },
      ];
    }
    const data = (releases || [])
      .filter((r) => !r.draft)
      .slice(0, limit)
      .map((r) => ({
        tag: r.tag_name,
        name: r.name || r.tag_name,
        date: r.published_at,
        prerelease: !!r.prerelease,
        body: r.body || '',
        url: r.html_url,
      }));
    writeChangelogCache(repo, data);
    return data;
  }

  async function loadChangelogs() {
    const roots = document.querySelectorAll('[data-changelog]');
    for (const root of roots) {
      const repo = root.getAttribute('data-changelog');
      if (!repo) continue;
      const limit = parseInt(root.getAttribute('data-limit') || '1', 10);
      try {
        const releases = await fetchRepoChangelogs(repo, limit);
        if (!releases.length) continue;
        root.innerHTML = releases
          .map((r) => {
            const date = formatReleaseDate(r.date);
            const badge = r.prerelease
              ? ' <span class="badge">Pre-release</span>'
              : '';
            return `
          <article class="changelog-block">
            <h3>
              <a href="${escapeHtml(r.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(repo)} ${escapeHtml(r.tag)}</a>
              ${date ? `<span class="changelog-date">${escapeHtml(date)}</span>` : ''}
              ${badge}
            </h3>
            <div class="changelog-body">${renderReleaseBody(r.body)}</div>
          </article>`;
          })
          .join('');
      } catch {
        /* keep static HTML fallback */
      }
    }
  }

  loadChangelogs();

  /* Known issues still come from local JSON */
  async function fillFromJson(sel, url, render) {
    const root = document.querySelector(sel);
    if (!root) return;
    try {
      const res = await fetch(url);
      if (!res.ok) return;
      render(root, await res.json());
    } catch {}
  }

  fillFromJson('[data-known-issues]', 'data/known-issues.json', (root, data) => {
    const items = Array.isArray(data.items) ? data.items : [];
    const list = items.length
      ? `<ul class="compare-list" style="list-style:disc;padding-left:1.2rem">
        ${items.map((i) => `<li style="display:list-item;border:0;padding:4px 0">${escapeHtml(i)}</li>`).join('')}
      </ul>`
      : '<p style="color:var(--text-dim)">No known issues listed for the current release.</p>';
    root.innerHTML = `
      <div class="callout warn"><strong>${escapeHtml(data.version)}</strong> — ${escapeHtml(data.notice)}</div>
      ${list}`;
  });

  /* GitHub stars for stats (verifiable only) */
  document.querySelectorAll('[data-github-stars]').forEach(async (el) => {
    const repo = el.getAttribute('data-github-stars');
    try {
      const res = await fetch(`https://api.github.com/repos/Synergy-Tweaks/${repo}`);
      if (!res.ok) return;
      const json = await res.json();
      if (typeof json.stargazers_count === 'number') {
        el.textContent = json.stargazers_count.toLocaleString('en-US');
      }
    } catch {}
  });

  /* Screenshot lightbox */
  (function initLightbox() {
    const triggers = Array.from(document.querySelectorAll('.lightbox-trigger'));
    if (!triggers.length) return;

    const root = document.createElement('div');
    root.className = 'lightbox';
    root.id = 'lightbox';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'Screenshot viewer');
    root.innerHTML = `
      <div class="lightbox-dialog">
        <button type="button" class="lightbox-prev" aria-label="Previous image">‹</button>
        <button type="button" class="lightbox-next" aria-label="Next image">›</button>
        <button type="button" class="lightbox-close" aria-label="Close">×</button>
        <img class="lightbox-img" src="" alt="">
        <div class="lightbox-caption"></div>
      </div>`;
    document.body.appendChild(root);

    const img = root.querySelector('.lightbox-img');
    const caption = root.querySelector('.lightbox-caption');
    let index = 0;
    let lastFocus = null;

    function openAt(i) {
      index = (i + triggers.length) % triggers.length;
      const t = triggers[index];
      const src = t.getAttribute('data-lightbox-src') || t.querySelector('img')?.src || '';
      const cap = t.getAttribute('data-lightbox-caption') || '';
      const alt = t.querySelector('img')?.alt || cap;
      img.src = src;
      img.alt = alt;
      caption.textContent = cap;
      root.classList.toggle('single-mode', triggers.length < 2);
      root.classList.add('is-open');
      document.body.classList.add('lightbox-open');
      document.documentElement.classList.add('lightbox-open');
      root.querySelector('.lightbox-close').focus();
    }

    function close() {
      root.classList.remove('is-open');
      document.body.classList.remove('lightbox-open');
      document.documentElement.classList.remove('lightbox-open');
      img.removeAttribute('src');
      if (lastFocus) lastFocus.focus();
    }

    triggers.forEach((t, i) => {
      t.addEventListener('click', () => {
        lastFocus = t;
        openAt(i);
      });
    });

    root.querySelector('.lightbox-close').addEventListener('click', close);
    root.querySelector('.lightbox-prev').addEventListener('click', () => openAt(index - 1));
    root.querySelector('.lightbox-next').addEventListener('click', () => openAt(index + 1));
    root.addEventListener('click', (e) => {
      if (e.target === root) close();
    });
    document.addEventListener('keydown', (e) => {
      if (!root.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') openAt(index - 1);
      else if (e.key === 'ArrowRight') openAt(index + 1);
    });
  })();
})();
