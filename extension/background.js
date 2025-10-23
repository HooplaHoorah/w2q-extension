chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "w2q-send-selection",
    title: "Send selection → Web-to-Quest",
    contexts: ["selection"]
  });

  // Let users click the toolbar icon to open the side panel
  try { chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }); } catch {}
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "w2q-send-selection" || !tab?.id) return;

  const text = info.selectionText || "";
  await chrome.storage.session.set({ w2q_latestSelection: text });

  // IMPORTANT: path is relative to the extension root, not /extension/
  await chrome.sidePanel.setOptions({
    tabId: tab.id,
    path: "sidepanel.html",
    enabled: true
  });

  // Will fail quietly on chrome://newtab — use a normal https page to test
  try { await chrome.sidePanel.open({ tabId: tab.id }); } catch {}
});
