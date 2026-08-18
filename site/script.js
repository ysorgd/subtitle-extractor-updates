const FALLBACK_RELEASE = Object.freeze({
  version: '1.0.0',
  publishedAt: '2026-08-18',
  releaseNotes: 'V1.0.0 正式版。',
  sha256: '9CD91A1570252E255B7194868CD91A5B43A6798CD13DFB10DE31136DF1D2DE45',
  downloadUrl: 'https://gitee.com/yttcast/subtitle-extractor-updates/releases/download/v1.0.0/SubtitleExtractor_V1.0.0_Setup_x64.exe',
});

const SAME_ORIGIN_MANIFEST = '../latest.json';
const GITEE_CONTENTS_API = 'https://gitee.com/api/v5/repos/yttcast/subtitle-extractor-updates/contents/latest.json?ref=main';
const REQUEST_TIMEOUT_MS = 3500;

async function fetchJson(url) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'omit',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`请求失败：${response.status}`);
    return await response.json();
  } finally {
    window.clearTimeout(timeout);
  }
}

function decodeBase64Utf8(value) {
  const binary = atob(value.replace(/\s/g, ''));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

async function fetchManifest() {
  try {
    return await fetchJson(SAME_ORIGIN_MANIFEST);
  } catch {
    const file = await fetchJson(GITEE_CONTENTS_API);
    if (!file || typeof file.content !== 'string' || file.encoding !== 'base64') {
      throw new Error('Gitee 返回的 latest.json 内容无效');
    }
    return JSON.parse(decodeBase64Utf8(file.content));
  }
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
  if (downloadUrl.protocol !== 'https:') throw new Error('download_url 必须使用 HTTPS');

  return {
    version,
    publishedAt,
    releaseNotes,
    sha256,
    downloadUrl: downloadUrl.toString(),
  };
}

function applyRelease(release, statusText) {
  document.querySelectorAll('[data-version]').forEach((element) => {
    element.textContent = `V${release.version}`;
  });
  document.querySelector('[data-published-at]').textContent = release.publishedAt;
  document.querySelector('[data-release-notes]').textContent = release.releaseNotes;
  document.querySelector('[data-sha256]').textContent = release.sha256;
  document.querySelector('[data-download]').href = release.downloadUrl;
  document.querySelector('[data-manifest-status]').textContent = statusText;
}

async function loadRelease() {
  try {
    const release = normalizeManifest(await fetchManifest());
    applyRelease(release, '已载入最新版本');
  } catch {
    applyRelease(FALLBACK_RELEASE, '当前显示内置版本信息');
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
