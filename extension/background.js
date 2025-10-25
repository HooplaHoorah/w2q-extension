// --- background.js (v3.3) ---
const KEY = 'W2Q_SELECTION';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'w2q_send_selection',
      title: 'Send selection → Web-to-Quest',
      contexts: ['selection'],
    });
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'w2q_send_selection' || !tab?.id) return;
  try {
    await chrome.sidePanel.open({ tabId: tab.id }); // uses manifest default_path
    const text = (info.selectionText || '').toString().trim();
    const bucket = chrome.storage?.session ?? chrome.storage.local;
    await bucket.set({ [KEY]: text });
    // No runtime.sendMessage call; panel will pick up via storage listeners
  } catch (err) {
    console.warn('[W2Q] ctxmenu flow error', err);
  }
});
