<div align="center">
  <img src="src-tauri/icons/icon.png" alt="seeker Logo" width="120" height="120">

  <h1>seeker</h1>

  <p>
    <strong>Deepseek agent command center for CodeWhale</strong>
  </p>

</div>

[![Downloads](https://img.shields.io/github/downloads/milisp/seeker/total.svg)](https://github.com/milisp/seeker/releases)

<img alt="seeker-8" src="https://github.com/user-attachments/assets/499728bd-f649-4da7-8cd9-8312ce239252" />

## Install via Homebrew

```sh
brew tap milisp/seeker
brew install --cask seeker
```

## Download

[MacOS ARM dmg Release](https://github.com/milisp/seeker/releases) 

## Support Providers

- [deepseek](https://platform.deepseek.com)
- [Atlascloud](https://www.atlascloud.ai?ref=FRZY3G)
- [Nvidia Nim](https://build.nvidia.com/?modal=signin&utm_medium=organic&utm_campaign=seeker)
- [Openrouter](https://openrouter.ai)
- [Ollama](https://ollama.com)
- any OpenAI compatibility API

## Architecture

[AGENTS.md](AGENTS.md)

## Development

### install codewhale

- [CodeWhale](https://github.com/Hmbown/CodeWhale)

#### copy codewhale-tui or link

```sh
cp /path/of/codewhale-tui to src-tauri/bin/codewhale-tui-aarch64-apple-darwin # depends the platform and archh you dev
```

[prerequisites](https://tauri.app/start/prerequisites/)

### install bun

```sh
curl -fsSL https://bun.com/install | bash
```

### install package

```sh
bun i
```

### start dev

```sh
bun tauri dev
```