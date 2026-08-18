import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const siteRoot = new URL('../', import.meta.url);
const html = readFileSync(new URL('index.html', siteRoot), 'utf8');
const script = readFileSync(new URL('script.js', siteRoot), 'utf8');
const rootReadme = readFileSync(new URL('../../README.md', import.meta.url), 'utf8');

function loadScript() {
  const context = vm.createContext({
    AbortController,
    TextDecoder,
    Uint8Array,
    URL,
    atob,
    console,
    fetch: async () => { throw new Error('offline'); },
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

test('页面提供两个独立下载按钮且不声明自动跳转', () => {
  assert.match(html, /data-github-download-link/);
  assert.match(html, /从 GitHub 下载/);
  assert.match(html, /data-gitee-download-link/);
  assert.match(html, /国内备用下载（Gitee）/);
  assert.doesNotMatch(html + script, /下载失败.{0,20}(自动|跳转)/);
});

test('GitHub 清单只接受 github.com 的 HTTPS 下载地址', () => {
  const context = loadScript();
  const valid = vm.runInContext(`normalizeManifest({
    version: '1.0.0',
    published_at: '2026-08-18',
    release_notes: '正式版 1.0.0。',
    sha256: '9CD91A1570252E255B7194868CD91A5B43A6798CD13DFB10DE31136DF1D2DE45',
    download_url: 'https://github.com/ysorgd/subtitle-extractor-updates/releases/download/v1.0.0/SubtitleExtractor_V1.0.0_Setup_x64.exe'
  })`, context);
  assert.equal(valid.download_url, 'https://github.com/ysorgd/subtitle-extractor-updates/releases/download/v1.0.0/SubtitleExtractor_V1.0.0_Setup_x64.exe');
  assert.throws(() => vm.runInContext(`normalizeManifest({
    version: '1.0.0',
    published_at: '2026-08-18',
    release_notes: '正式版 1.0.0。',
    sha256: '9CD91A1570252E255B7194868CD91A5B43A6798CD13DFB10DE31136DF1D2DE45',
    download_url: 'https://gitee.com/yttcast/subtitle-extractor-updates/releases/download/v1.0.0/SubtitleExtractor_V1.0.0_Setup_x64.exe'
  })`, context), /github\.com/);
});

test('断网兜底固定为 V1.0.0 GitHub 安装包且 Gitee 按钮独立存在', () => {
  const context = loadScript();
  const fallback = vm.runInContext('FALLBACK', context);
  assert.equal(fallback.version, '1.0.0');
  assert.equal(fallback.published_at, '2026-08-18');
  assert.equal(fallback.release_notes, '正式版 1.0.0。');
  assert.equal(fallback.sha256, '9CD91A1570252E255B7194868CD91A5B43A6798CD13DFB10DE31136DF1D2DE45');
  assert.equal(fallback.download_url, 'https://github.com/ysorgd/subtitle-extractor-updates/releases/download/v1.0.0/SubtitleExtractor_V1.0.0_Setup_x64.exe');
  assert.match(html, /https:\/\/gitee\.com\/yttcast\/subtitle-extractor-updates\/releases\/download\/v1\.0\.0\/SubtitleExtractor_V1\.0\.0_Setup_x64\.exe/);
});

test('远端文本只通过 textContent 渲染', () => {
  assert.doesNotMatch(script, /innerHTML/);
  assert.match(script, /textContent/);
  assert.match(script, /fetch\('\.\.\/latest\.json', \{ cache: 'no-store' \}\)/);
});

test('GitHub Pages 从 main /docs 发布并继续读取根目录清单', () => {
  assert.match(siteRoot.pathname, /\/docs\/$/);
  assert.match(rootReadme, /\[`docs\/`\]\(\.\/docs\/\)/);
  assert.match(rootReadme, /main\s*\/docs/);
  assert.match(script, /fetch\('\.\.\/latest\.json', \{ cache: 'no-store' \}\)/);
});
