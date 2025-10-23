chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "w2q-send-selection",
    title: "Send selection → Web-to-Quest",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "w2q-send-selection") return;
  const text = info.selectionText || "";
  await chrome.storage.session.set({ w2q_latestSelection: text });
  await chrome.sidePanel.open({ tabId: tab.id });
  await chrome.sidePanel.setOptions({ tabId: tab.id, path: "sidepanel.html" });
});
