// sidepanel.js — Web-to-Quest (General + Math bridge + Theme)

document.addEventListener('DOMContentLoaded', () => {
  // ---------- helpers ----------
  const $ = (s) => document.querySelector(s);
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

  const KEY_SELECTION = 'W2Q_SELECTION';
  const KEY_THEME = 'W2Q_THEME';

  // ---------- elements ----------
  const tabs = {
    general: $('#mode-general'),
    math:    $('#mode-math'),
  };
  const ai = {
    toggle:  $('#aiToggle'),
    status:  $('#aiStatus'),
  };
  const gen = {
    input:   $('#genInput'),
    out:     $('#genOut'),
    sum:     $('#genSummarize'),
    rewr:    $('#genRewrite'),
    tone:    $('#genTone'),
    trans:   $('#genTranslate'),
    lang:    $('#genLang'),
    extr:    $('#genExtract'),
    extrSel: $('#genExtractType'),
  };
  const mathFrame = $('#mathFrame');
  const themeSel  = $('#themeSel');

  // ---------- Math bridge ----------
  function sendToMath(text) {
    try { mathFrame?.contentWindow?.postMessage({ type: 'w2q:selection', text: text || '' }, '*'); } catch {}
  }
  function sendThemeToMath(theme) {
    try { mathFrame?.contentWindow?.postMessage({ type: 'w2q:theme', theme }, '*'); } catch {}
  }
  mathFrame?.addEventListener('load', () => {
    sendToMath(gen.input?.value || '');
    // push current theme to iframe on first load
    const t = document.documentElement.getAttribute('data-theme') || 'light';
    sendThemeToMath(t);
  });

  // ---------- tabs ----------
  function setMode(mode) {
    document.body.dataset.mode = mode;
    tabs.general?.setAttribute('aria-selected', mode === 'general' ? 'true' : 'false');
    tabs.math?.setAttribute('aria-selected',    mode === 'math'    ? 'true' : 'false');
    if (mode === 'math') sendToMath(gen.input?.value || '');
  }
  on(tabs.general, 'click', () => setMode('general'));
  on(tabs.math,    'click', () => setMode('math'));
  if (!document.body.dataset.mode) setMode('general');

  // ---------- AI gate ----------
  const aiEnabled = () => !!ai.toggle?.checked;
  function updateAiStatus() {
    if (ai.status) ai.status.textContent = aiEnabled() ? 'AI: enabled' : 'AI: unavailable';
    updateButtons();
  }
  on(ai.toggle, 'change', updateAiStatus);

  // ---------- Theme ----------
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  function computeTheme(mode) {
    if (mode === 'auto') return prefersDark.matches ? 'dark' : 'light';
    return mode;
  }
  async function applyTheme(mode) {
    const resolved = computeTheme(mode);
    document.documentElement.setAttribute('data-theme', resolved);
    sendThemeToMath(resolved);
    try { await (chrome.storage?.local?.set?.({ [KEY_THEME]: mode })); } catch {}
  }
  // init theme
  (async () => {
    let mode = 'auto';
    try {
      const stored = await (chrome.storage?.local?.get?.(KEY_THEME) || {});
      if (stored && (stored[KEY_THEME] === 'light' || stored[KEY_THEME] === 'dark' || stored[KEY_THEME] === 'auto')) {
        mode = stored[KEY_THEME];
      }
    } catch {}
    if (themeSel) themeSel.value = mode;
    applyTheme(mode);
  })();
  on(themeSel, 'change', () => applyTheme(themeSel.value));
  prefersDark.addEventListener?.('change', () => {
    if (themeSel?.value === 'auto') applyTheme('auto');
  });
  // reflect changes from other pages of the extension
  chrome.storage?.onChanged?.addListener((changes, area) => {
    if (area === 'local' && changes[KEY_THEME] && themeSel) {
      const mode = changes[KEY_THEME].newValue || 'auto';
      themeSel.value = mode;
      applyTheme(mode);
    }
  });

  // ---------- button enable rules ----------
  function updateButtons() {
    const hasText = !!gen.input?.value.trim();
    if (gen.trans) gen.trans.disabled = !hasText;
    if (gen.extr)  gen.extr.disabled  = !hasText;
    const allowAI = hasText && aiEnabled();
    if (gen.sum)  gen.sum.disabled  = !allowAI;
    if (gen.rewr) gen.rewr.disabled = !allowAI;
  }
  on(gen.input, 'input', () => { updateButtons(); sendToMath(gen.input.value); });

  // ---------- selection bridge ----------
  async function primeFromStorage() {
    try {
      const bucket = chrome.storage.session || chrome.storage.local;
      const obj = await bucket.get(KEY_SELECTION);
      if (obj && obj[KEY_SELECTION] && gen.input) {
        gen.input.value = obj[KEY_SELECTION];
        sendToMath(obj[KEY_SELECTION]);
      }
    } catch {}
    setTimeout(updateButtons, 0);
  }
  chrome.storage?.onChanged?.addListener((changes, area) => {
    if ((area === 'session' || area === 'local') && changes[KEY_SELECTION] && gen.input) {
      const v = changes[KEY_SELECTION].newValue || '';
      gen.input.value = v; updateButtons(); sendToMath(v);
    }
  });

  // ---------- local (non-AI) transforms ----------
  const getText = () => (gen.input?.value || '').trim();
  const writeOut = (v) => { if (gen.out) gen.out.value = Array.isArray(v) ? v.join('\n') : String(v || ''); };
  const sentences = (t, n) => t.split(/(?<=[.!?])\s+|\n+/).map(s=>s.trim()).filter(Boolean).slice(0, n);
  function extract(text, mode) {
    const list = (xs) => (xs.length ? xs : ['(no matches)']).map(s => '• ' + s);
    if (mode === 'highlights' || mode === 'key_points') return list(sentences(text, 5));
    if (mode === 'tasks') {
      const verbs = /^(add|remove|mix|stir|heat|cool|install|update|create|review|send|call|email|schedule)\b/i;
      const lines = text.split(/\n+/).map(s=>s.trim()).filter(Boolean);
      return list(lines.filter(l => verbs.test(l)));
    }
    if (mode === 'people') {
      const re = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g;
      const set = new Set(); let m; while ((m = re.exec(text))) set.add(m[1]);
      return list([...set]);
    }
    if (mode === 'dates') {
      const re = /\b(?:\d{1,2}[\/.-]\d{1,2}(?:[\/.-]\d{2,4})?|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}(?:,\s*\d{4})?)\b/gi;
      return list(text.match(re) || []);
    }
    return list(sentences(text, 5));
  }
  on(gen.trans, 'click', () => {
    const text = getText(); if (!text) return;
    const lang = (gen.lang?.value || 'Spanish').toUpperCase();
    writeOut(`[Translate → ${lang}]\n\n${text}`);
  });
  on(gen.extr, 'click', () => {
    const text = getText(); if (!text) return;
    writeOut(extract(text, gen.extrSel?.value || 'highlights'));
  });

  // ---------- AI-gated stubs ----------
  function guardAI(run) {
    if (!aiEnabled()) { writeOut('AI is disabled or unavailable. Enable AI features + on-device Gemini Nano.'); return; }
    run();
  }
  on(gen.sum,  'click', () => guardAI(() => writeOut(['[Summary]', '', ...sentences(getText(), 3).map(s=>'• '+s)])));
  on(gen.rewr, 'click', () => guardAI(() => {
    const tone = (gen.tone?.value || 'friendly');
    let out = getText();
    if (tone === 'concise') out = sentences(out, 2).join(' ');
    else if (tone === 'formal') out = out.replace(/\b(can't|won't|don't)\b/gi, m => ({ "can't":'cannot', "won't":'will not', "don't":'do not' }[m.toLowerCase()]));
    else if (tone === 'simplify') out = out.replace(/\b(utilize|commence|purchase)\b/gi, m => ({ 'utilize':'use', 'commence':'start', 'purchase':'buy' }[m.toLowerCase()]));
    writeOut(`[Rewrite • ${tone}]` + '\n\n' + out);
  }));

  // ---------- init ----------
  updateAiStatus();
  primeFromStorage();
});
