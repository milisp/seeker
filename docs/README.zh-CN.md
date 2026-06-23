<div align="center">
  <img src="../src-tauri/icons/icon.png" alt="seeker Logo" width="120" height="120">

  <h1>seeker</h1>

  <p>
    <strong>Deepseek 智能体控制中心</strong>
  </p>

</div>

[English](../README.md) | 中文

[![Downloads](https://img.shields.io/github/downloads/milisp/seeker/total.svg)](https://github.com/milisp/seeker/releases)


<img alt="seeker-8" src="https://github.com/user-attachments/assets/499728bd-f649-4da7-8cd9-8312ce239252" />

## 通过 Homebrew 安装

```sh
brew tap milisp/seeker
brew install --cask seeker
```

## 下载

[最新版本](https://github.com/milisp/seeker/releases)

## 支持的提供者

- [deepseek](https://platform.deepseek.com)
- [Atlascloud](https://www.atlascloud.ai?ref=FRZY3G)
- [Nvidia Nim](https://build.nvidia.com/?modal=signin&utm_medium=organic&utm_campaign=seeker)
- [Openrouter](https://openrouter.ai)
- [Ollama](https://ollama.com)
- 任何 OpenAI 兼容 API

## 架构

[AGENTS.md](AGENTS.md)

## 开发

### 安装 CodeWhale

- [CodeWhale](https://github.com/Hmbown/CodeWhale)

#### 复制或链接 codewhale-tui

```sh
cp /path/of/codewhale-tui to src-tauri/bin/codewhale-tui-aarch64-apple-darwin # 取决于您的平台和架构
```

[先决条件](https://tauri.app/start/prerequisites/)

### 安装 bun

```sh
curl -fsSL https://bun.com/install | bash
```

### 安装依赖

```sh
bun i
```

### 启动开发

```sh
bun tauri dev
```