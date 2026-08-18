# GitHub Pages 下载页

本目录保存“字幕提取器”下载官网的静态源码：

- `index.html`：页面结构与 V1.0.0 内置兜底信息
- `styles.css`：桌面端与手机端响应式样式
- `script.js`：匿名读取 `latest.json`、安全校验远端字段并更新页面
- `assets/`：网站使用的品牌图标

## 当前状态

该网站从 GitHub 仓库的 `main /docs` 发布到：

https://ysorgd.github.io/subtitle-extractor-updates/

## 版本信息来源

页面加载时读取同仓库根目录的 `../latest.json`。如果网络失败、JSON 无效或字段校验不通过，则显示内置的 V1.0.0 信息。

GitHub 清单中的下载地址仅接受 `https://github.com`。远端文字字段通过 `textContent` 写入页面，不使用 `innerHTML`。

页面始终提供两个独立按钮：

- `从 GitHub 下载`：GitHub Release 主通道。
- `国内备用下载（Gitee）`：同版本的 Gitee Release 备用通道。

网站不会探测下载失败，也不会自动跳转到另一通道。

## 部署

本目录只包含 HTML、CSS、JavaScript 和图片，可从 GitHub Pages 的 `main /docs` 直接发布，无需构建。

部署前无需构建，也不要上传 Token、本机路径、构建缓存、测试文件或本地模型文件。
