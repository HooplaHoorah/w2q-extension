# Web‑to‑Quest: Prototype Parser Patch (Oct 24, 2025)

This bundle **patches `extension/prototype.js`** to:
1) Treat the letter **x/X** as multiplication (`*`) **when there is no equals sign** in the input.
2) Normalize extra multiplication symbols (`⨉`, `⋅`, `∗`) to `*` so copied math from the web parses correctly.

It does **not** change any other files. (If you still get the `icons/` error when loading the extension, either move your PNGs into `extension/icons/` _or_ update `manifest.json` to point to the PNGs you have.)

## What this fixes
- `12 x 5 + 3` → parsed as `12 * 5 + 3`
- `12 × 5 + 3` (U+00D7 MULTIPLICATION SIGN) → parsed
- `12 ⨉ 5 + 3` (U+2A09 N-ARY TIMES), `12 ⋅ 5` (U+22C5 DOT OPERATOR), `12 ∗ 5` (U+2217 ASTERISK OPERATOR) → parsed
- `2x + 3 = 9` is **not** altered (linear-in-`x` equations are still allowed).

---

## Option A — One-liner patch in your working copy
From the **repo root** (folder containing `/extension/prototype.js`):

```bash
node scripts/apply_patch.js
```

> If you don't have `node` in PATH, install Node.js 18+ or use Option B.

---

## Option B — Apply and push via git (Linux/macOS)
From the **repo root**:

```bash
bash scripts/push_patch.sh
```

This will:
- create a branch `fix/sanitize-mul`,
- run the patcher,
- commit the change, and
- push to your origin.

Then open a PR from `fix/sanitize-mul` → `main`.

---

## Option C — Windows (PowerShell/cmd)
From the **repo root**:

```powershell
scripts\push_patch.bat
```

---

## Verify locally
1. Reload the extension on `chrome://extensions`.
2. In the Web‑to‑Quest sidepanel, try:
   - `12 x 5 + 3` → Steps should render; answer checks against 27.
   - `12 × 5 + 3` → same as above.
3. If you still see “Could not parse”, try these quick checks:
   - Hard refresh the sidepanel page (Ctrl/Cmd + R) after reloading the extension.
   - Open DevTools (sidepanel → ⋯ → Inspect) and confirm no runtime errors from `prototype.js`.
   - Clear local extension data (Extensions → Details → Clear data) and reload.

---

## Notes about icons
If you see **“Could not load icon 'icons/icon16.png'”**:
- Ensure the paths in `extension/manifest.json` say:
  ```json
  "icons": { "16": "icons/icon16.png", "48": "icons/icon48.png", "128": "icons/icon128.png" }
  ```
- And that files exist at `extension/icons/icon16.png`, `icon48.png`, `icon128.png`.
- Or change those paths to wherever your PNGs live.

Good luck! :)
