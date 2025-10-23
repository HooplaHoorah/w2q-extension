(async () => {
  const iframe = document.getElementById("proto");
  const { w2q_latestSelection } = await chrome.storage.session.get("w2q_latestSelection");

  const send = () => {
    try {
      iframe.contentWindow?.postMessage(
        { type: "W2Q_SELECTION", text: w2q_latestSelection || "" },
        "*"
      );
    } catch (_) {}
  };

  // If it's already loaded, send immediately; otherwise wait.
  const ready = () => {
    const doc = iframe.contentDocument;
    return doc && doc.readyState === "complete";
  };

  if (ready()) send();
  iframe.addEventListener("load", send, { once: true });

  // Fallback in case timing is weird
  setTimeout(() => { if (!ready()) return; send(); }, 400);
})();
