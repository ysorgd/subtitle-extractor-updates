import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const siteRoot = new URL('../', import.meta.url);
const html = readFileSync(new URL('index.html', siteRoot), 'utf8');
const script = readFileSync(new URL('script.js', siteRoot), 'utf8');
const docsReadme = readFileSync(new URL('README.md', siteRoot), 'utf8');
const rootReadme = readFileSync(new URL('../../README.md', import.meta.url), 'utf8');
const rootManifest = JSON.parse(readFileSync(new URL('../../latest.json', import.meta.url), 'utf8'));

const OFFICIAL = Object.freeze({
  version: '1.2.0',
  published_at: '2026-08-27',
  release_notes: 'V1.2.0：新增视觉模式、设置记忆、自定义违禁词与时间线滚动交互，并改进剧本匹配、人工复核及识别稳定性。',
  sha256: '9EBD0884531F43CF930BDB4297201E0BEB22F212CDE2C0C5603548C347887E89',
  github_download_url: 'https://github.com/ysorgd/subtitle-extractor/releases/download/v1.2.0/SubtitleExtractor_V1.2.0_Setup_x64.exe',
  gitee_download_url: 'https://gitee.com/yttcast/subtitle-extractor-updates/releases/download/v1.2.0/SubtitleExtractor_V1.2.0_Setup_x64.exe',
});

function manifest(downloadUrl, overrides = {}) {
  return {
    version: OFFICIAL.version,
    published_at: OFFICIAL.published_at,
    release_notes: OFFICIAL.release_notes,
    sha256: OFFICIAL.sha256,
    download_url: downloadUrl,
    ...overrides,
  };
}

function loadScript(fetchImplementation = async () => { throw new Error('offline'); }) {
  const context = vm.createContext({
    AbortController,
    Promise,
    TextDecoder,
    Uint8Array,
    URL,
    atob,
    console,
    fetch: fetchImplementation,
    window: {
      clearTimeout,
      matchMedia: () => ({ matches: false }),
      setTimeout,
    },
    document: {
      querySelectorAll: () => [],
      querySelector: () => null,
    },
    IntersectionObserver: class {
      observe() {}
      unobserve() {}
    },
  });
  const definitionOnly = script.replace(/\nloadRelease\(\);\s*$/, '');
  vm.runInContext(definitionOnly, context, { filename: 'docs/script.js' });
  return context;
}

test('页面保持最终 Demo 的四段信息架构', () => {
  assert.match(html, /<section class="hero"/);
  assert.match(html, /<section class="features"/);
  assert.match(html, /<section class="updates"/);
  assert.match(html, /<footer class="site-footer"/);
  assert.doesNotMatch(html, /release-details|details-grid|开始校对前/);
  assert.equal((html.match(/class="feature-card reveal"/g) ?? []).length, 4);
});

test('页面提供 GitHub 主下载和 Gitee 备用下载且不声明自动跳转', () => {
  assert.match(html, /class="download-primary"[^>]*data-github-download-link/);
  assert.match(html, /从 GitHub 下载 Windows x64 安装包/);
  assert.match(html, /class="download-secondary"[^>]*data-gitee-download-link/);
  assert.match(html, /Gitee 备用下载/);
  assert.doesNotMatch(html + script, /下载失败.{0,20}(自动|跳转)/);
});

test('两类清单下载地址必须保持通道隔离', () => {
  const context = loadScript();
  context.githubManifest = manifest(OFFICIAL.github_download_url);
  context.giteeManifest = manifest(OFFICIAL.gitee_download_url);

  const github = vm.runInContext("normalizeManifest(githubManifest, 'github')", context);
  const gitee = vm.runInContext("normalizeManifest(giteeManifest, 'gitee')", context);
  assert.equal(github.download_url, OFFICIAL.github_download_url);
  assert.equal(gitee.download_url, OFFICIAL.gitee_download_url);

  assert.throws(
    () => vm.runInContext("normalizeManifest(giteeManifest, 'github')", context),
    /github\.com/,
  );
  assert.throws(
    () => vm.runInContext("normalizeManifest(githubManifest, 'gitee')", context),
    /gitee\.com/,
  );
});

test('静态 fallback 与当前正式 V1.2.0 完全一致', () => {
  const context = loadScript();
  const fallback = vm.runInContext('FALLBACK_RELEASE', context);
  assert.equal(fallback.version, OFFICIAL.version);
  assert.equal(fallback.published_at, OFFICIAL.published_at);
  assert.equal(fallback.release_notes, OFFICIAL.release_notes);
  assert.equal(fallback.sha256, OFFICIAL.sha256);
  assert.equal(fallback.github_download_url, OFFICIAL.github_download_url);
  assert.equal(fallback.gitee_download_url, OFFICIAL.gitee_download_url);
});

test('GitHub 主清单与 Gitee 备用下载使用同一正式 Installer 身份', () => {
  assert.equal(rootManifest.version, OFFICIAL.version);
  assert.equal(rootManifest.sha256, OFFICIAL.sha256);
  assert.equal(rootManifest.download_url, OFFICIAL.github_download_url);
  assert.match(OFFICIAL.github_download_url, /SubtitleExtractor_V1\.2\.0_Setup_x64\.exe$/);
  assert.match(OFFICIAL.gitee_download_url, /SubtitleExtractor_V1\.2\.0_Setup_x64\.exe$/);
});

test('元数据按 GitHub、Gitee、静态 fallback 顺序选择且下载地址独立', () => {
  const context = loadScript();
  context.githubRelease = {
    ...manifest(OFFICIAL.github_download_url),
    version: '1.2.0',
    release_notes: 'GitHub metadata',
  };
  context.giteeRelease = {
    ...manifest(OFFICIAL.gitee_download_url),
    version: '1.1.9',
    release_notes: 'Gitee metadata',
  };

  const both = vm.runInContext('resolveRelease(githubRelease, giteeRelease)', context);
  assert.equal(both.version, '1.2.0');
  assert.equal(both.release_notes, 'GitHub metadata');
  assert.equal(both.github_download_url, OFFICIAL.github_download_url);
  assert.equal(both.gitee_download_url, OFFICIAL.gitee_download_url);

  const giteeOnly = vm.runInContext('resolveRelease(null, giteeRelease)', context);
  assert.equal(giteeOnly.version, '1.1.9');
  assert.equal(giteeOnly.release_notes, 'Gitee metadata');
  assert.equal(giteeOnly.github_download_url, OFFICIAL.github_download_url);
  assert.equal(giteeOnly.gitee_download_url, OFFICIAL.gitee_download_url);

  const offline = vm.runInContext('resolveRelease(null, null)', context);
  assert.equal(offline.version, OFFICIAL.version);
  assert.equal(offline.github_download_url, OFFICIAL.github_download_url);
  assert.equal(offline.gitee_download_url, OFFICIAL.gitee_download_url);
});

test('脚本独立读取 GitHub 和 Gitee manifest', () => {
  assert.match(script, /github:\s*'https:\/\/raw\.githubusercontent\.com\/ysorgd\/subtitle-extractor-updates\/main\/latest\.json'/);
  assert.match(script, /gitee:\s*'https:\/\/gitee\.com\/yttcast\/subtitle-extractor-updates\/raw\/main\/latest\.json'/);
  assert.match(script, /Promise\.allSettled/);
});

test('GitHub Pages 实际请求正式 GitHub Raw manifest', async () => {
  let requestedUrl = null;
  const context = loadScript(async (url) => {
    requestedUrl = url;
    return {
      ok: true,
      json: async () => manifest(OFFICIAL.github_download_url),
    };
  });

  await vm.runInContext("fetchManifest('github')", context);
  assert.equal(
    requestedUrl,
    'https://raw.githubusercontent.com/ysorgd/subtitle-extractor-updates/main/latest.json',
  );
});

test('静态页面已经是正式 V1.2.0 且没有发布占位内容', () => {
  assert.match(html, /V1\.2\.0/);
  assert.match(html, new RegExp(OFFICIAL.sha256));
  assert.match(html, new RegExp(OFFICIAL.published_at));
  assert.doesNotMatch(html + script + docsReadme, /V1\.[01]\.0|发布准备中|构建后填写|TODO|TBD|placeholder/i);
});

test('更新入口和 footer 使用正式仓库链接', () => {
  assert.match(html, /https:\/\/github\.com\/ysorgd\/subtitle-extractor\/releases\/tag\/v1\.2\.0/);
  assert.match(html, /https:\/\/github\.com\/ysorgd\/subtitle-extractor(?:["/])/);
  assert.match(html, /https:\/\/gitee\.com\/yttcast\/subtitle-extractor(?:["/])/);
  assert.doesNotMatch(html, /href=["'](?:javascript:|https?:\/\/example\.com)/i);
});

test('远端文字只通过 textContent 渲染', () => {
  assert.doesNotMatch(script, /innerHTML/);
  assert.match(script, /textContent/);
});

test('V1.2.0 页面说明安全同步、Review 和下一条待检查', () => {
  assert.match(html, /安全剧本同步/);
  assert.match(html, /Review/);
  assert.match(html, /下一条待检查/);
});

test('GitHub Pages 继续从 main /docs 发布', () => {
  assert.match(siteRoot.pathname, /\/docs\/$/);
  assert.match(rootReadme, /\[`docs\/`\]\(\.\/docs\/\)/);
  assert.match(rootReadme, /main\s*\/docs/);
  assert.match(docsReadme, /main\s*\/docs/);
});
