# 字幕提取器

字幕提取器是一款面向 Windows 用户的中文字幕整理工具，可用于从剧本同步字幕、编辑时间轴、校对字幕文本，并结合音频识别结果辅助整理。

> 当前正式版本：**V1.0.0**
> 支持平台：**Windows x64**

## 下载

### [⬇ 下载 Windows x64 安装包（V1.0.0）](https://gitee.com/yttcast/subtitle-extractor-updates/releases/download/v1.0.0/SubtitleExtractor_V1.0.0_Setup_x64.exe)

请仅下载并运行上方链接指向的官方安装包：

`SubtitleExtractor_V1.0.0_Setup_x64.exe`

**不需要下载仓库 ZIP，也不需要使用 Git、Python 或命令行。**

## 如何安装

1. 点击上方“下载 Windows x64 安装包”。
2. 下载完成后，运行 `SubtitleExtractor_V1.0.0_Setup_x64.exe`。
3. 按安装程序提示完成安装。
4. 如果电脑上已经安装旧版，直接安装新版即可覆盖升级旧版。

## 如何检查更新

- 打开字幕提取器，在程序中使用“检查更新”。
- 也可以打开 [更新与版本说明](https://gitee.com/yttcast/subtitle-extractor-updates/releases) 查看已发布版本。
- 网站源码会读取仓库中的 [`latest.json`](./latest.json) 显示当前版本信息；读取失败时会继续显示内置的 V1.0.0 下载信息。

## SHA256 校验值

V1.0.0 官方安装包：

```text
9CD91A1570252E255B7194868CD91A5B43A6798CD13DFB10DE31136DF1D2DE45
```

下载后可使用 Windows PowerShell 校验：

```powershell
Get-FileHash .\SubtitleExtractor_V1.0.0_Setup_x64.exe -Algorithm SHA256
```

输出值应与上面的 SHA256 完全一致。

## 常见说明

- 本仓库用于发布更新清单、安装包版本说明及静态官网源码。
- 请使用 Releases 中提供的 `.exe` 官方安装包，不要下载仓库 ZIP 作为安装包。
- 安装新版会覆盖升级旧版，通常无需先卸载旧版本。
- 安装包不包含本地 ASR 模型权重；首次使用本地识别时，需要自行配置模型目录。
- 如需查看历史版本，请进入 [Releases](https://gitee.com/yttcast/subtitle-extractor-updates/releases)。

## 静态官网源码

静态网页源码位于 [`site/`](./site/)，当前不单独部署。详情见 [`site/README.md`](./site/README.md)。
