[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Latest release](https://img.shields.io/github/v/release/HooplaHoorah/w2q-extension)](https://github.com/HooplaHoorah/w2q-extension/releases)
[![Pre-release](https://img.shields.io/github/v/release/HooplaHoorah/w2q-extension?include_prereleases&label=pre-release)](https://github.com/HooplaHoorah/w2q-extension/releases)

# Web-to-Quest (Chrome MV3)

Turn on-page math into a guided quest: **Steps**, **Hints**, and **Answer Check** — with an auto-expanding Steps view.

## How to use
1. Select a math expression on any page.
2. Right-click → *Send selection → Web-to-Quest* (or paste into **Problem**).
3. Click **Generate steps** and/or **Hint me** for guidance.
4. Type your answer, then click **Check answer** — the correct result is **only** shown here.

## New (v0.2.0-skeleton)
- **Settings → Enable AI features** (off by default). When enabled and available:
  - **Explain this step (AI):** asks Gemini Nano (Prompt API) for a one-line rationale.
  - **Generate printable variants (AI):** drafts a list of similar problems (no answers).

> These AI features are scaffolded and gracefully degrade when Nano isn’t available.

## Install (Developer mode)
1. Open `chrome://extensions` and enable *Developer mode*.
2. Click **Load unpacked** and select the `/extension` folder.
3. Try it on any page.
- [v0.1.0 (stable)](https://github.com/HooplaHoorah/w2q-extension/releases/tag/v0.1.0) – initial MVP (local steps/hints/check)
- [v0.2.0-alpha (pre-release)](https://github.com/HooplaHoorah/w2q-extension/releases/tag/v0.2.0-alpha) – AI scaffolding (Prompt API stubs)


## Tech
- Chrome **Manifest V3**, Side Panel UI
- **CSP-safe** arithmetic engine (shunting-yard; no `eval`)
- Auto-expanding Steps with *Show all / Collapse*
- Privacy-first: no data leaves device; AI features require explicit opt-in

## Development
- Source lives under `/extension`.
- On tags matching `v*.*.*`, GitHub Actions zips the extension and uploads an artifact (see `.github/workflows/build.yml`).

## License
MIT © 2025 Hoopla Hoorah, LLC



## Privacy

- All computation runs locally in the extension’s side panel.
- We do not collect, transmit, or store personal data or analytics.
- Selection text is cached briefly in chrome.storage.session (with chrome.storage.local as a fallback) only to pass data from the background script to the side panel, then overwritten on the next selection.
- AI features are **optional** (off by default). When enabled, they use Chrome’s built-in on-device **Gemini Nano** (Prompt API). If Nano isn’t available, these buttons remain disabled. No third-party scripts or network calls are made by the extension.

## Permissions used

- \sidePanel\ — open the Web-to-Quest side panel  
- \contextMenus\ — add “Send selection → Web-to-Quest”  
- \storage\ — pass selection text from the background script to the side panel

*No \host_permissions\ are requested.*

