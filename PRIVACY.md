# Privacy

- All computation runs locally in the extension’s side panel.
- We do not collect, transmit, or store personal data or analytics.
- Selection text is cached briefly in chrome.storage.session (with chrome.storage.local as a fallback) only to pass data from the background script to the side panel, then overwritten on the next selection.
- AI features are **optional** (off by default). When enabled, they use Chrome’s built-in on-device **Gemini Nano** (Prompt API). If Nano isn’t available, these buttons remain disabled. No third-party scripts or network calls are made by the extension.
