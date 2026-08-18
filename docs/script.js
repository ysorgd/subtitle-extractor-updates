const FALLBACK = Object.freeze({
  version: '1.0.0',
  published_at: '2026-08-18',
  release_notes: '正式版 1.0.0。',
  sha256: '9CD91A1570252E255B7194868CD91A5B43A6798CD13DFB10DE31136DF1D2DE45',
  download_url: 'https://github.com/ysorgd/subtitle-extractor-updates/releases/download/v1.0.0/SubtitleExtractor_V1.0.0_Setup_x64.exe'
});

async function fetchManifest() {
  const response = await fetch('../latest.json', { cache: 'no-store' });
  if (!response.ok) throw new Error(`请求失败：${response.status}`);
  return await response.json();
}

function readText(value, fieldName, maximumLength) {
  if (typeof value !== 'string') throw new Error(`${fieldName} 不是文本`);
  const text = value.trim();
  if (!text || text.length > maximumLength) throw new Error(`${fieldName} 长度无效`);
  return text;
}

function normalizeManifest(manifest) {
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    throw new Error('latest.json 格式无效');
  }

  const version = readText(manifest.version, 'version', 32).replace(/^v/i, '');
  const publishedAt = readText(manifest.published_at, 'published_at', 32);
  const releaseNotes = readText(manifest.release_notes ?? manifest.notes, 'release_notes', 2000);
  const sha256 = readText(manifest.sha256, 'sha256', 64).toUpperCase();
  if (!/^[A-F0-9]{64}$/.test(sha256)) throw new Error('sha256 格式无效');

  const downloadUrl = new URL(readText(manifest.download_url, 'download_url', 2048));
  if (downloadUrl.protocol !== 'https:' || downloadUrl.hostname.toLowerCase() !== 'github.com') {
    throw new Error('download_url 必须指向 github.com 的 HTTPS 地址');
  }

  return {
    version,
    published_at: publishedAt,
    release_notes: releaseNotes,
    sha256,
    download_url: downloadUrl.toString(),
  };
}

function applyRelease(release, statusText) {
  document.querySelectorAll('[data-version]').forEach((element) => {
    element.textContent = `V${release.version}`;
  });
  document.querySelector('[data-published-at]').textContent = release.published_at;
  document.querySelector('[data-release-notes]').textContent = release.release_notes;
  document.querySelector('[data-sha256]').textContent = release.sha256;
  document.querySelector('[data-github-download-link]').href = release.download_url;
  document.querySelector('[data-manifest-status]').textContent = statusText;
}

async function loadRelease() {
  try {
    const release = normalizeManifest(await fetchManifest());
    applyRelease(release, '已载入最新版本');
  } catch {
    applyRelease(FALLBACK, '当前显示内置版本信息');
  }
}

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('visible');
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -4% 0px' });

document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

const timeline = document.querySelector('[data-timeline]');
const playhead = document.querySelector('[data-playhead]');

timeline?.addEventListener('pointermove', (event) => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const bounds = timeline.getBoundingClientRect();
  const position = ((event.clientX - bounds.left) / bounds.width) * 100;
  playhead.style.left = `${Math.max(36, Math.min(72, position))}%`;
});

timeline?.addEventListener('pointerleave', () => {
  playhead.style.left = '52%';
});

loadRelease();
