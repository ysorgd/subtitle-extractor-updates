# GitHub Pages 下载页

本目录保存“字幕提取器”下载官网的纯静态源码：

- `index.html`：最终 Demo 信息架构与 V1.1.0 正式兜底数据
- `styles.css`：桌面端与手机端响应式样式
- `script.js`：读取双端 `latest.json`、校验字段并更新页面
- `assets/`：网站使用的品牌图标
- `tests/site_contract.test.mjs`：静态网站发布契约测试

## 部署

网站从 GitHub 更新仓库的 `main /docs` 发布到：

https://ysorgd.github.io/subtitle-extractor-updates/

本目录无需构建，不使用 `gh-pages` 分支、GitHub Actions 或前端框架。

## 版本与下载信息

页面独立读取两个发布清单：

- GitHub：`https://raw.githubusercontent.com/ysorgd/subtitle-extractor-updates/main/latest.json`
- Gitee：`https://gitee.com/yttcast/subtitle-extractor-updates/raw/main/latest.json`

版本、发布日期、版本说明和 SHA256 优先采用有效的 GitHub 清单；GitHub 清单不可用时采用有效的 Gitee 清单；两者均不可用时显示内置的正式 V1.1.0 数据。

两个下载地址始终按通道独立维护和校验：

- GitHub 主下载只接受 `https://github.com` 的正式 Installer 地址。
- Gitee 备用下载只接受 `https://gitee.com` 的正式 Installer 地址。

页面不会把一个通道的下载地址填入另一个按钮，也不会自动跳转下载通道。远端文字字段只通过 `textContent` 写入页面。

## 发布检查

```powershell
node --test docs/tests/site_contract.test.mjs
git diff --check
```

不要上传 Token、本机路径、构建缓存、测试截图或本地模型文件。
