function copyHash(btn) {
  const block = btn.parentElement;
  const hashEl = block.querySelector('[data-field="sha"]');
  const text = (hashEl ? hashEl.textContent : block.textContent).trim();

  const reset = () => {
    btn.textContent = 'Copy';
    btn.classList.remove('copied');
  };
  const done = () => {
    btn.textContent = 'Copied';
    btn.classList.add('copied');
    setTimeout(reset, 1600);
  };
  const selectHash = () => {
    if (!hashEl) return;
    const range = document.createRange();
    range.selectNodeContents(hashEl);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    btn.textContent = 'Press Ctrl+C';
    setTimeout(reset, 2500);
  };
  const legacyCopy = () => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    ta.remove();
    return ok;
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(() => (legacyCopy() ? done() : selectHash()));
  } else {
    legacyCopy() ? done() : selectHash();
  }
}

if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.12 });

  document.querySelectorAll('.section, .dash-section, .cta-final, .warning-strip').forEach(el => {
    el.classList.add('reveal');
    obs.observe(el);
  });
}

document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (id === '#') {
      e.preventDefault();
      if (a.hasAttribute('data-modal')) return;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (id.length > 1) {
      const t = document.querySelector(id);
      if (t) {
        e.preventDefault();
        t.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  });
});

const formatCount = (val, decimals) => {
  if (decimals > 0) return val.toFixed(decimals);
  return Math.round(val).toString();
};

const animateCount = (el) => {
  const target = parseFloat(el.dataset.count);
  const decimals = parseInt(el.dataset.decimals || '0', 10);
  const duration = 1600;
  const start = performance.now();
  el.textContent = formatCount(0, decimals);
  const tick = (now) => {
    const elapsed = now - start;
    const t = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = formatCount(target * eased, decimals);
    if (t < 1) requestAnimationFrame(tick);
    else el.textContent = formatCount(target, decimals);
  };
  requestAnimationFrame(tick);
};

const countObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting && !e.target.dataset.counted) {
      e.target.dataset.counted = '1';
      animateCount(e.target);
    }
  });
}, { threshold: 0.4 });

document.querySelectorAll('.count').forEach(el => countObs.observe(el));

document.addEventListener('DOMContentLoaded', () => {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;
  const lightboxImg = lightbox.querySelector('.lightbox-img');
  const lightboxCaption = lightbox.querySelector('.lightbox-caption');
  const galleryImages = Array.from(document.querySelectorAll('.gallery-item.has-image'));
  let currentIndex = 0;
  let navMode = 'gallery';

  function openLightbox(index) {
    if (lightboxImg.classList.contains('is-zoomed')) {
      lightboxImg.classList.remove('is-zoomed', 'is-panning');
      lightbox.classList.remove('is-zoomed');
      lightboxImg.style.removeProperty('--zoom-x');
      lightboxImg.style.removeProperty('--zoom-y');
    }
    currentIndex = index;
    navMode = 'gallery';
    const item = galleryImages[index];
    const img = item.querySelector('img');
    const tag = item.querySelector('.gallery-tag');
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt || '';
    lightboxCaption.textContent = tag ? tag.textContent : '';
    lightbox.classList.add('is-open');
    lightbox.classList.remove('single-mode');
    document.body.classList.add('lightbox-open');
    document.documentElement.classList.add('lightbox-open');
  }

  function openSingle(src, alt, caption) {
    if (lightboxImg.classList.contains('is-zoomed')) {
      lightboxImg.classList.remove('is-zoomed', 'is-panning');
      lightbox.classList.remove('is-zoomed');
      lightboxImg.style.removeProperty('--zoom-x');
      lightboxImg.style.removeProperty('--zoom-y');
    }
    navMode = 'single';
    lightboxImg.src = src;
    lightboxImg.alt = alt || '';
    lightboxCaption.textContent = caption || '';
    lightbox.classList.add('is-open');
    lightbox.classList.add('single-mode');
    document.body.classList.add('lightbox-open');
    document.documentElement.classList.add('lightbox-open');
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    document.body.classList.remove('lightbox-open');
    document.documentElement.classList.remove('lightbox-open');
  }

  function showPrev() {
    if (navMode !== 'gallery') return;
    openLightbox((currentIndex - 1 + galleryImages.length) % galleryImages.length);
  }

  function showNext() {
    if (navMode !== 'gallery') return;
    openLightbox((currentIndex + 1) % galleryImages.length);
  }

  galleryImages.forEach((item, i) => {
    item.addEventListener('click', () => openLightbox(i));
  });

  const dashImage = document.querySelector('.dash-image');
  if (dashImage) {
    const dashImg = dashImage.querySelector('img');
    if (dashImg) {
      dashImage.style.cursor = 'pointer';
      dashImage.addEventListener('click', () => {
        openSingle(dashImg.src, dashImg.alt, 'SynergyOS Dash');
      });
    }
  }

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      if (lightboxImg.classList.contains('is-zoomed')) {
        lightboxImg.classList.remove('is-panning');
        resetZoom();
      } else {
        closeLightbox();
      }
    }
  });

  let panBaseRect = null;
  let panRafId = null;
  let panPendingEvent = null;

  function resetZoom() {
    lightboxImg.classList.remove('is-zoomed', 'is-panning');
    lightbox.classList.remove('is-zoomed');
    lightboxImg.style.removeProperty('--zoom-x');
    lightboxImg.style.removeProperty('--zoom-y');
    panBaseRect = null;
    if (panRafId) { cancelAnimationFrame(panRafId); panRafId = null; }
    panPendingEvent = null;
  }

  function applyPan(e) {
    if (!panBaseRect) return;
    const fx = (e.clientX - panBaseRect.left) / panBaseRect.width;
    const fy = (e.clientY - panBaseRect.top) / panBaseRect.height;
    const cfx = Math.max(0, Math.min(1, fx));
    const cfy = Math.max(0, Math.min(1, fy));
    const tx = (0.5 - cfx) * panBaseRect.width;
    const ty = (0.5 - cfy) * panBaseRect.height;
    lightboxImg.style.setProperty('--zoom-x', tx + 'px');
    lightboxImg.style.setProperty('--zoom-y', ty + 'px');
  }

  function schedulePan(e) {
    panPendingEvent = e;
    if (panRafId) return;
    panRafId = requestAnimationFrame(() => {
      panRafId = null;
      if (panPendingEvent) {
        applyPan(panPendingEvent);
        panPendingEvent = null;
      }
    });
  }

  lightbox.querySelector('.lightbox-close').addEventListener('click', () => { resetZoom(); closeLightbox(); });
  lightbox.querySelector('.lightbox-prev').addEventListener('click', () => { resetZoom(); showPrev(); });
  lightbox.querySelector('.lightbox-next').addEventListener('click', () => { resetZoom(); showNext(); });

  lightboxImg.addEventListener('click', (e) => {
    e.stopPropagation();
    if (lightboxImg.classList.contains('is-zoomed')) {
      lightboxImg.classList.remove('is-panning');
      resetZoom();
    } else {
      panBaseRect = lightboxImg.getBoundingClientRect();
      applyPan(e);
      lightboxImg.classList.add('is-zoomed');
      lightbox.classList.add('is-zoomed');
      setTimeout(() => {
        if (lightboxImg.classList.contains('is-zoomed')) {
          lightboxImg.classList.add('is-panning');
        }
      }, 320);
    }
  });

  lightbox.addEventListener('mousemove', (e) => {
    if (!lightboxImg.classList.contains('is-zoomed')) return;
    schedulePan(e);
  });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape') { resetZoom(); closeLightbox(); }
    else if (e.key === 'ArrowLeft') { resetZoom(); showPrev(); }
    else if (e.key === 'ArrowRight') { resetZoom(); showNext(); }
  });

  const infoModals = {
    install: document.getElementById('modal-install'),
    issues: document.getElementById('modal-issues'),
    changelog: document.getElementById('modal-changelog'),
    faq: document.getElementById('modal-faq')
  };

  function openInfoModal(key) {
    const modal = infoModals[key];
    if (!modal) return;
    modal.classList.add('is-open');
    document.body.classList.add('info-modal-open');
    document.documentElement.classList.add('info-modal-open');
  }

  function closeInfoModals() {
    Object.values(infoModals).forEach(m => {
      if (m) m.classList.remove('is-open');
    });
    document.body.classList.remove('info-modal-open');
    document.documentElement.classList.remove('info-modal-open');
    if (location.hash.startsWith('#modal-')) history.replaceState(null, '', location.pathname + location.search);
  }

  document.querySelectorAll('[data-modal]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      if (history.replaceState) history.replaceState(null, '', link.getAttribute('href'));
      openInfoModal(link.getAttribute('data-modal'));
    });
  });

  Object.values(infoModals).forEach(modal => {
    if (!modal) return;
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeInfoModals();
    });
    const closeBtn = modal.querySelector('.info-modal-close');
    if (closeBtn) closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closeInfoModals();
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('info-modal-open')) {
      closeInfoModals();
    }
  });
});

// Download latest release handler
const FALLBACK = {
  SynergyOS: 'https://github.com/Synergy-Tweaks/SynergyOS/releases/download/1.7/SynergyOS.v0.7.apbx',
  SynToolkit: 'https://github.com/Synergy-Tweaks/SynToolkit/releases/download/1.7/SynToolkit-Setup-1.7.0-Stable.exe',
};

const RELEASES_CACHE_KEY = 'synergy-releases-v1';
const RELEASES_TTL = 6 * 60 * 60 * 1000;
const REPOS = ['SynergyOS', 'SynToolkit'];

function readReleaseCache() {
  try {
    const raw = localStorage.getItem(RELEASES_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed.ts || Date.now() - parsed.ts > RELEASES_TTL) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeReleaseCache(data) {
  try {
    localStorage.setItem(RELEASES_CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
  } catch {}
}

function formatSize(bytes) {
  const mb = bytes / 1e6;
  return (mb >= 100 ? Math.round(mb) : mb.toFixed(1)) + ' MB';
}

function formatThousands(n) {
  return Number(n).toLocaleString('en-US');
}

function shortCount(n) {
  const k = n / 1000;
  return (k >= 10 ? Math.round(k) : k.toFixed(1).replace(/\.0$/, '')) + 'k';
}

async function fetchRepoRelease(repo) {
  const res = await fetch(`https://api.github.com/repos/Synergy-Tweaks/${repo}/releases?per_page=100`);
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);
  const releases = await res.json();
  const latest = releases.find(r => !r.draft && !r.prerelease) || releases[0];
  if (!latest) throw new Error('no releases');
  const asset = (latest.assets || [])[0];
  const downloads = releases.reduce(
    (sum, r) => sum + (r.assets || []).reduce((s, a) => s + (a.download_count || 0), 0),
    0
  );
  return {
    tag: latest.tag_name,
    filename: asset ? asset.name : '',
    size: asset ? asset.size : 0,
    sha: asset && asset.digest ? asset.digest.replace(/^sha256:/, '') : '',
    downloads,
    url: asset ? asset.browser_download_url : '',
  };
}

function applyReleaseData(data) {
  document.querySelectorAll('[data-release][data-field]').forEach(el => {
    const info = data[el.dataset.release];
    if (!info) return;
    switch (el.dataset.field) {
      case 'version': el.textContent = info.tag; break;
      case 'filename': if (info.filename) el.textContent = info.filename; break;
      case 'size': if (info.size) el.textContent = formatSize(info.size); break;
      case 'downloads': el.textContent = formatThousands(info.downloads); break;
      case 'sha': if (info.sha) el.textContent = info.sha; break;
    }
  });
  const hero = document.querySelector('[data-field="os-downloads"]');
  if (hero && data.SynergyOS) hero.textContent = shortCount(data.SynergyOS.downloads) + ' downloads';
}

// Hydrate version, size, hash and download counts from the GitHub API.
async function loadReleaseData() {
  let data = readReleaseCache();
  if (!data) {
    try {
      const entries = await Promise.all(REPOS.map(fetchRepoRelease));
      data = Object.fromEntries(REPOS.map((repo, i) => [repo, entries[i]]));
      writeReleaseCache(data);
    } catch {
      return; // keep the static values already in the HTML
    }
  }
  applyReleaseData(data);
}

loadReleaseData();

async function resolveLatestAsset(repo, ext) {
  const cached = readReleaseCache();
  if (cached && cached[repo] && cached[repo].url) return cached[repo].url;
  try {
    const res = await fetch(`https://api.github.com/repos/Synergy-Tweaks/${repo}/releases/latest`, {
      signal: typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(3000) : undefined,
    });
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

document.querySelectorAll('.nav-menu-links a, .nav-cta').forEach(a =>
  a.addEventListener('click', () => document.querySelector('.nav-menu').removeAttribute('open'))
);

const navWrap = document.querySelector('.nav-wrap');
if (navWrap) {
  const setScrolled = () => navWrap.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', setScrolled, { passive: true });
  setScrolled();
}
