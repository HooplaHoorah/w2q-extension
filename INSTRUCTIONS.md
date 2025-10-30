# Web‑to‑Quest — Final1 Bundle Instructions

Follow these steps in VS Code to publish the final1 build.

## 1) Branch
```bash
git checkout main
git pull
git checkout -b release/v0.1.4
```

## 2) Copy files
- Replace the **extension/** folder with the one in this bundle (if present).
- Add **demo/screenshots/** (from this bundle).
- Ensure `extension/manifest.json` uses:
  - "service_worker": "background.js"
  - "side_panel": { "default_path": "sidepanel.html" }
  - permissions: `contextMenus, sidePanel, storage`

## 3) Bump version
Edit `extension/manifest.json` → "version": "0.1.4"

## 4) README
Open your `README.md`, and paste the content from `README_SNIPPET.md` under a **Demo** + **Screenshots** section.

## 5) Commit & PR
```bash
git add extension demo INSTRUCTIONS.md README_SNIPPET.md CHANGELOG_DRAFT.md
git commit -m "release: v0.1.4 (final1) — demo screenshots, docs, and build"
git push -u origin release/v0.1.4
```
Open PR → **Squash & merge**.

## 6) Release
Publish GitHub Release `v0.1.4` (attach the judge ZIP).

## 7) Local verify
- `chrome://extensions` → Reload
- General tab: Translate/Extract
- Math tab: Steps/Hint/Check; Printable variants; Theme toggle
