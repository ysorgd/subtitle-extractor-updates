const FALLBACK_RELEASE = Object.freeze({
  version: '1.1.0',
  published_at: '2026-08-24',
  release_notes: 'V1.1.0 改进字幕编辑器重绘与快捷键，加入稳定字幕 ID、Review/待检查及更安全的剧本同步，并移除继承时间码旧流程。',
  sha256: '6A91B98962E172344DA2DE3033F662CDFBC74C9846B6EA2CD1F4D114A8DDC7C7',
  github_download_url: 'https://github.com/ysorgd/subtitle-extractor/releases/download/v1.1.0/SubtitleExtractor_V1.1.0_Setup_x64.exe',
  gitee_download_url: 'https://gitee.com/yttcast/subtitle-extractor-updates/releases/download/v1.1.0/SubtitleExtractor_V1.1.0_Setup_x64.exe',
});

const MANIFEST_ENDPOINTS = Object.freeze({
  github: 'https://raw.githubusercontent.com/ysorgd/subtitle-extractor-updates/main/latest.json',
  gitee: 'https://gitee.com/yttcast/subtitle-extractor-updates/raw/main/latest.json',
});

const GITEE_CONTENTS_ENDPOINT = 'https://gitee.com/api/v5/repos/yttcast/subtitle-extractor-updates/contents/latest.json?ref=main';

async function fetchJson(url, timeoutMs = 4500) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { cache: 'no-store', signal: controller.signal });
    if (!response.ok) throw new Error(`请求失败：${response.status}`);
    return await response.json();
  } finally {
    window.clearTimeout(timeout);
  }
}

function decodeGiteeContents(payload) {
  if (!payload || typeof payload.content !== 'string') {
    throw new Error('Gitee Contents API 返回格式无效');
  }
  const compact = payload.content.replace(/\s/g, '');
  const bytes = Uint8Array.from(atob(compact), (character) => character.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

async function fetchManifest(channel) {
  if (channel === 'github') return await fetchJson(MANIFEST_ENDPOINTS.github);
  if (channel !== 'gitee') throw new Error('未知 manifest 通道');

  try {
    return await fetchJson(MANIFEST_ENDPOINTS.gitee);
  } catch {
    return decodeGiteeContents(await fetchJson(GITEE_CONTENTS_ENDPOINT));
  }
}

function readText(value, fieldName, maximumLength) {
  if (typeof value !== 'string') throw new Error(`${fieldName} 不是文本`);
  const text = value.trim();
  if (!text || text.length > maximumLength) throw new Error(`${fieldName} 长度无效`);
  return text;
}

function normalizeManifest(manifest, channel) {
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    throw new Error('latest.json 格式无效');
  }

  const version = readText(manifest.version, 'version', 32).replace(/^v/i, '');
  if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(version)) {
    throw new Error('version 格式无效');
  }
  const publishedAt = readText(manifest.published_at, 'published_at', 32);
  const releaseNotes = readText(manifest.release_notes ?? manifest.notes, 'release_notes', 2000);
  const sha256 = readText(manifest.sha256, 'sha256', 64).toUpperCase();
  if (!/^[A-F0-9]{64}$/.test(sha256)) throw new Error('sha256 格式无效');

  const downloadUrl = new URL(readText(manifest.download_url, 'download_url', 2048));
  const expectedHost = channel === 'github' ? 'github.com' : channel === 'gitee' ? 'gitee.com' : null;
  if (!expectedHost) throw new Error('未知 manifest 通道');
  if (downloadUrl.protocol !== 'https:' || downloadUrl.hostname.toLowerCase() !== expectedHost) {
    throw new Error(`download_url 必须指向 ${expectedHost} 的 HTTPS 地址`);
  }
  if (!/\/releases\/download\/v[^/]+\/SubtitleExtractor_V[^/]+_Setup_x64\.exe$/.test(downloadUrl.pathname)) {
    throw new Error('download_url 不是正式 Windows x64 安装包地址');
  }

  return {
    version,
    published_at: publishedAt,
    release_notes: releaseNotes,
    sha256,
    download_url: downloadUrl.toString(),
  };
}

function resolveRelease(githubRelease, giteeRelease) {
  const metadata = githubRelease ?? giteeRelease ?? FALLBACK_RELEASE;
  return {
    version: metadata.version,
    published_at: metadata.published_at,
    release_notes: metadata.release_notes,
    sha256: metadata.sha256,
    github_download_url: githubRelease?.download_url ?? FALLBACK_RELEASE.github_download_url,
    gitee_download_url: giteeRelease?.download_url ?? FALLBACK_RELEASE.gitee_download_url,
  };
}

function manifestStatus(githubRelease, giteeRelease) {
  if (githubRelease && giteeRelease) return '已载入 GitHub 与 Gitee 正式版本信息';
  if (githubRelease) return '已载入 GitHub 正式版本信息；Gitee 使用内置正式链接';
  if (giteeRelease) return 'GitHub 清单暂不可用；已载入 Gitee 正式版本信息';
  return '清单暂不可用；当前显示内置 V1.1.0 正式信息';
}

function applyRelease(release, statusText) {
  document.querySelectorAll('[data-version]').forEach((element) => {
    element.textContent = `V${release.version}`;
  });
  document.querySelectorAll('[data-published-at]').forEach((element) => {
    element.textContent = release.published_at;
  });
  document.querySelector('[data-release-notes]').textContent = release.release_notes;
  document.querySelector('[data-sha256]').textContent = release.sha256;
  document.querySelector('[data-github-download-link]').href = release.github_download_url;
  document.querySelector('[data-gitee-download-link]').href = release.gitee_download_url;
  document.querySelector('[data-release-link]').href = `https://github.com/ysorgd/subtitle-extractor/releases/tag/v${encodeURIComponent(release.version)}`;
  document.querySelector('[data-manifest-status]').textContent = statusText;
}

async function loadRelease() {
  const [githubResult, giteeResult] = await Promise.allSettled([
    fetchManifest('github').then((value) => normalizeManifest(value, 'github')),
    fetchManifest('gitee').then((value) => normalizeManifest(value, 'gitee')),
  ]);
  const githubRelease = githubResult.status === 'fulfilled' ? githubResult.value : null;
  const giteeRelease = giteeResult.status === 'fulfilled' ? giteeResult.value : null;
  applyRelease(resolveRelease(githubRelease, giteeRelease), manifestStatus(githubRelease, giteeRelease));
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
