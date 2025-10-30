// background.js (MV3) — robust side panel open with popup fallback + positioning
const CTX_ID = 'w2q_send_selection';
const KEY    = 'W2Q_SELECTION';

// Popup placement options
const POPUP_W = 420;
const POPUP_H = 740;
const MARGIN  = 16;
const POSITION_MODE  = 'dockRight'; // 'dockRight' | 'center'
const REMEMBER_LAST  = true;        // set to false to ignore saved bounds

function installMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create(
      { id: CTX_ID, title: 'Send selection → Web-to-Quest', contexts: ['selection'] },
      () => {
        const e = chrome.runtime.lastError;
        if (e && !/duplicate id/i.test(e.message)) console.warn('[W2Q] contextMenu warn:', e.message);
      }
    );
  });
}
chrome.runtime.onInstalled.addListener(installMenu);
chrome.runtime.onStartup.addListener(installMenu);

// --- Side Panel open helpers ------------------------------------------------
async function tryOpenSidePanel(tab) {
  try { await chrome.sidePanel.setOptions({ tabId: tab.id, path: 'sidepanel.html', enabled: true }); } catch {}
  await new Promise(r => setTimeout(r, 40));
  try { await chrome.sidePanel.open({ tabId: tab.id }); return true; } catch {}
  try { await chrome.sidePanel.open({ windowId: tab.windowId }); return true; } catch {}
  try { await chrome.sidePanel.open({}); return true; } catch {}
  return false;
}

// --- Popup helpers ----------------------------------------------------------
async function getPopupBounds(tab) {
  if (REMEMBER_LAST) {
    const { w2qPopupBounds } = await chrome.storage.local.get('w2qPopupBounds');
    if (w2qPopupBounds && Number.isFinite(w2qPopupBounds.left)) return w2qPopupBounds;
  }

  // Base on the current browser window’s position/size
  const win = await chrome.windows.get(tab.windowId);
  const w = POPUP_W, h = POPUP_H;

  if (POSITION_MODE === 'center') {
    const left = Math.max(0, (win.left ?? 0) + ((win.width ?? (w + 2*MARGIN)) - w) / 2);
    const top  = Math.max(0, (win.top  ?? 0) + ((win.height ?? (h + 2*MARGIN)) - h) / 2);
    return { left: Math.round(left), top: Math.round(top), width: w, height: h };
  }

  // default: dock-right (like native side panel)
  const left = Math.max(0, (win.left ?? 0) + (win.width ?? (w + MARGIN)) - w - MARGIN);
  const top  = Math.max(0, (win.top  ?? 0) + MARGIN);
  return { left: Math.round(left), top: Math.round(top), width: w, height: h };
}

async function openPopupFallback(tab) {
  const url = chrome.runtime.getURL('sidepanel.html');
  const bounds = await getPopupBounds(tab);

  const { w2qPopupId } = await chrome.storage.session.get('w2qPopupId');
  if (w2qPopupId) {
    try {
      await chrome.windows.update(w2qPopupId, { focused: true, ...bounds });
      return;
    } catch {
      // stale id → create fresh
    }
  }

  const win = await chrome.windows.create({ url, type: 'popup', ...bounds });
  await chrome.storage.session.set({ w2qPopupId: win.id });
}

// Remember last bounds while you drag/resize the popup
chrome.windows.onBoundsChanged.addListener(async (win) => {
  const { w2qPopupId } = await chrome.storage.session.get('w2qPopupId');
  if (REMEMBER_LAST && win.id === w2qPopupId) {
    await chrome.storage.local.set({
      w2qPopupBounds: { left: win.left, top: win.top, width: win.width, height: win.height }
    });
  }
});

// Clear saved id when the popup closes
chrome.windows.onRemoved.addListener(async (id) => {
  const { w2qPopupId } = await chrome.storage.session.get('w2qPopupId');
  if (w2qPopupId === id) {
    await chrome.storage.session.remove('w2qPopupId');
  }
});

// --- Context menu flow ------------------------------------------------------
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== CTX_ID || !tab?.id) return;
  const text = (info.selectionText || '').toString().trim();
  const bucket = chrome.storage.session || chrome.storage.local;

  try {
    await bucket.set({ [KEY]: text });
    const opened = await tryOpenSidePanel(tab);
    if (!opened) await openPopupFallback(tab);
  } catch (err) {
    console.warn('[W2Q] ctxmenu flow error:', err);
    try { await openPopupFallback(tab); } catch {}
  }
});
