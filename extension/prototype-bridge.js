// prototype-bridge.js — Bridge for selection + theme
(() => {
  const KEY_SELECTION = 'W2Q_SELECTION';
  const KEY_THEME     = 'W2Q_THEME';

  function computeTheme(mode) {
    if (mode === 'auto') return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    return mode;
  }
  function applyTheme(modeOrFinal) {
    const final = modeOrFinal === 'light' || modeOrFinal === 'dark' ? modeOrFinal : computeTheme(modeOrFinal);
    document.documentElement.setAttribute('data-theme', final);
  }

  function findProblemBox() { return document.querySelector('#problem, textarea'); }
  function setProblem(value) {
    const el = findProblemBox(); if (!el) return;
    el.value = value || '';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }

  window.addEventListener('message', (e) => {
    if (!e || !e.data) return;
    if (e.data.type === 'w2q:selection') setProblem(e.data.text || '');
    if (e.data.type === 'w2q:theme')     applyTheme(e.data.theme);
  });

  try {
    const bucket = (chrome && chrome.storage && (chrome.storage.session || chrome.storage.local)) || null;
    if (bucket?.get) {
      bucket.get([KEY_SELECTION, KEY_THEME]).then((obj) => {
        if (obj?.[KEY_SELECTION]) setProblem(obj[KEY_SELECTION]);
        applyTheme(obj?.[KEY_THEME] ?? 'auto');
      });
      chrome.storage.onChanged.addListener((changes, area) => {
        if ((area === 'session' || area === 'local') && changes[KEY_SELECTION]) setProblem(changes[KEY_SELECTION].newValue || '');
        if (area === 'local' && changes[KEY_THEME]) applyTheme(changes[KEY_THEME].newValue);
      });
    }
  } catch {}
})();
