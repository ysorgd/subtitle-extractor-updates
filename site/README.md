# 静态官网源码

本目录保存“字幕提取器”下载官网的静态源码：

- `index.html`：页面结构与 V1.0.0 内置兜底信息
- `styles.css`：桌面端与手机端响应式样式
- `script.js`：匿名读取 `latest.json`、安全校验远端字段并更新页面
- `assets/`：网站使用的品牌图标

## 当前状态

该网站源码目前**不单独部署**。用户可直接通过仓库根目录的 [`README.md`](../README.md) 下载正式安装包。

## 版本信息来源

页面加载时会按以下顺序读取版本信息：

1. 同源的 `../latest.json`。
2. Gitee 公开 Contents API 中的同一份 `latest.json`，无需账号、Token 或 Cookie。
3. 如果请求超时、网络失败或字段校验不通过，显示 `index.html` 内置的 V1.0.0 信息，下载按钮仍然可用。

远端下载地址仅接受 HTTPS。远端文字字段通过 `textContent` 写入页面，不使用 `innerHTML`。

## 未来部署

本目录只包含 HTML、CSS、JavaScript 和图片，可原样放入 GitHub Pages 或其他支持静态文件的网站托管服务。

如果仅部署 `site/`，页面会通过 Gitee 公共 API 获取版本信息；如果从整个仓库根目录提供静态文件，则优先读取同源 `latest.json`。

部署前无需构建，也不要上传 Token、本机路径、构建缓存、测试文件或本地模型文件。
