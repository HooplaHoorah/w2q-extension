# Web-to-Quest (Chrome MV3)

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Latest release](https://img.shields.io/github/v/release/HooplaHoorah/w2q-extension)](https://github.com/HooplaHoorah/w2q-extension/releases)
![Release Drafter](https://github.com/HooplaHoorah/w2q-extension/actions/workflows/release-drafter.yml/badge.svg)

Turn on-page text into a guided quest.  
- **Math tab:** steps, hints, and answer check (all local).  
- **General tab:** translate / extract everywhere; summarize / rewrite when on-device AI is available.

---

## Demo (2 minutes)

▶️ https://youtu.be/UONUOS2RKOU

---

## Screenshots

> If your filenames differ, adjust the image paths below. Put PNGs in `demo/screenshots/`.

<p align="center">
  <img src="demo/screenshots/01-context-menu.png" width="45%" alt="Context menu">
  <img src="demo/screenshots/02-general-input.png" width="45%" alt="General: Input"><br/>
  <img src="demo/screenshots/03-translate.png" width="45%" alt="General: Translate">
  <img src="demo/screenshots/04-extract.png" width="45%" alt="General: Extract"><br/>
  <img src="demo/screenshots/05-math.png" width="45%" alt="Math tab">
  <img src="demo/screenshots/06-theme.png" width="45%" alt="Theme toggle"><br/>
  <img src="demo/screenshots/07-optional-gemini-nano.png" width="45%" alt="Optional Gemini Nano">
  <img src="demo/screenshots/08-generate-steps.png" width="45%" alt="Generate steps"><br/>
  <img src="demo/screenshots/09-hint-me.png" width="45%" alt="Hint me">
  <img src="demo/screenshots/10-check-answer.png" width="45%" alt="Check answer"><br/>
  <img src="demo/screenshots/11-generate-printable-variants.png" width="45%" alt="Printable variants">
</p>

---

## What’s included

- **Side Panel UI** (with popup fallback)  
- **Math assistant**:  
  - *Generate steps* (auto-expanding list)  
  - *Hint me*  
  - *Check answer* (result appears only in the Check box)  
- **General tools**:  
  - *Translate* (no network, works everywhere)  
  - *Extract highlights* (no network, works everywhere)  
  - *Summarize* / *Rewrite* (require on-device AI if available)  
- **Theme**: Light / Dark / System  
- **Privacy-first**: no data leaves the device; AI is opt-in

---

## Quick start (Developer mode)

1) Open `chrome://extensions` → enable **Developer mode**.  
2) Click **Load unpacked** → select the `extension/` folder.  
3) Highlight text on any page → Right-click → **Send selection → Web-to-Quest**.  
4) The side panel (or popup fallback) opens with your selection prefilled.

---

## How to use

### General tab
1. Paste or send text into **Input**.  
2. Choose one action:  
   - **Translate** *(works offline)*  
   - **Extract** *(works offline)*  
   - **Summarize** / **Rewrite** *(AI-gated; see below)*  
3. Results appear in **Result**.

### Math tab
1. Paste or send the math expression into **Problem**.  
2. Click **Generate steps** and / or **Hint me**.  
3. Enter your answer → **Check answer** (only here is the correct value shown).  
4. **Generate printable variants** drafts similar problems (no answers).

---

## Built-in AI (Gemini Nano) — optional

Web-to-Quest works 100% without AI: math steps / hints / checks, Translate, and Extract are fully local.  
If Chrome exposes on-device **Gemini Nano** (Prompt API), **Summarize** and **Rewrite** enable automatically.

Enable (if you want AI):
- Use Chrome Canary and flags as described in `extension/help/ai.html`.  
- Open the side panel DevTools and run:
  ```js
  await window.ai?.canCreateTextSession?.()
  ```
  You might see: `ready` (enabled), `after-download` (model fetching), or `missing/unavailable` (no AI).

*(Graceful degradation: when AI isn’t available, those buttons stay disabled and everything else still works.)*

---

## Permissions

- `sidePanel` — open the Web-to-Quest panel  
- `contextMenus` — add **Send selection → Web-to-Quest**  
- `storage` — pass selection text from background to panel safely

*No `host_permissions` are requested.*

---

## Privacy

- All computation runs locally in the extension’s process.  
- We do **not** collect, transmit, or store personal data or analytics.  
- Selection text is cached briefly in `chrome.storage.session` (with `chrome.storage.local` as a fallback) only to pass data from background → side panel, then overwritten on the next selection.  
- AI features are **opt-in**; when enabled they use Chrome’s **on-device** Gemini Nano (no network calls).

---

## Development

- Source lives under `/extension`.  
- On tags matching `v*.*.*`, GitHub Actions can package the build (see `.github/workflows/*`).  
- Typical flow:
  ```bash
  # from repo root
  npm run lint     # (if you add tooling)
  # load /extension in chrome://extensions
  ```

---

## Troubleshooting

- **Panel didn’t appear** – It may open as a popup (fallback). You can also click the extension icon to open the panel.  
- **“AI: unavailable”** – Summarize/Rewrite are disabled; the rest still works.  
- **Context menu didn’t appear** – Reload the extension or right-click in a standard text selection area.

---

## Roadmap

- Expand the printable-variants generator  
- More extractors on the General tab  
- Optional in-panel tutorial cards

---

## License

MIT © 2025 Hoopla Hoorah, LLC
