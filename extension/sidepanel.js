(async () => {
  const { w2q_latestSelection } = await chrome.storage.session.get("w2q_latestSelection");
  const iframe = document.querySelector("iframe");
  if (!iframe || !w2q_latestSelection) return;
  iframe.addEventListener("load", () => {
    iframe.contentWindow.postMessage({ type: "W2Q_SELECTION", text: w2q_latestSelection }, "*");
  });
})();
