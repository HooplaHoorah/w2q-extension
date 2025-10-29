// --- AI availability probe & graceful fallback ---
function getAI() {
  return (globalThis?.ai || (globalThis?.window && window.ai)) || null;
}
function statusEl() {
  return document.getElementById('aiStatus');
}
function disableAIButtons() {
  document.querySelectorAll('[data-ai-only]').forEach(el => el.setAttribute('disabled', 'disabled'));
}

async function refreshAI() {
  const el = statusEl();
  if (!el) return; // DOM not ready or row missing
  const ai = getAI();
  if (!ai) { el.textContent = 'AI: unavailable'; disableAIButtons(); return; }

  let on = false; // set after probing AI so we can gate buttons below


  try {
    const s = await ai.canCreateTextSession();
    on = (s === 'ready');

    if (s === 'ready') {
      el.textContent = 'AI: ready';
    } else if (s === 'after-download') {
      el.textContent = 'AI: downloading…';
      disableAIButtons();
    } else {
      el.textContent = 'AI: unavailable';
      disableAIButtons();
    }
  } catch (err) {
    console.warn('AI probe failed', err);
    const el2 = statusEl();
    if (el2) el2.textContent = 'AI: unavailable';
    disableAIButtons();
  }
  // General buttons gate with AI availability (like Math)
  if (btnGenSummarize) { btnGenSummarize.disabled = !on; btnGenSummarize.title = on ? '' : 'Enable AI in Settings'; }
  if (btnGenRewrite)   { btnGenRewrite.disabled   = !on; btnGenRewrite.title   = on ? '' : 'Enable AI in Settings'; }
  if (btnGenTranslate) { btnGenTranslate.disabled = !on; btnGenTranslate.title = on ? '' : 'Enable AI in Settings'; }
  if (btnGenExtract)   { btnGenExtract.disabled   = !on; btnGenExtract.title   = on ? '' : 'Enable AI in Settings'; }

}

// Run after DOM is ready (works with or without <script defer>)
document.addEventListener('DOMContentLoaded', refreshAI);

// --- sidepanel.js (v3.3) ---
const KEY = 'W2Q_SELECTION';
const storeSess = chrome.storage?.session;
const store = storeSess || chrome.storage.local;

function $(sel){ return document.querySelector(sel); }
const problemEl = () => $('#problem');
const answerEl  = () => $('#answer');
const stepsOut  = () => $('#outSteps');
const hintsOut  = () => $('#outHints');
const answerOut = () => $('#outAnswer');


// --- expandable helper for Steps box ---
function updateExpandable(el, toggle){
  if (!el || !toggle) return;
  // Measure content height
  const needs = el.scrollHeight > 170; // threshold a bit bigger than max-height
  toggle.hidden = !needs;
  if (!needs){ el.dataset.expanded = 'false'; el.style.maxHeight = ''; return; }
  if (el.dataset.expanded === 'true'){
    el.style.maxHeight = el.scrollHeight + 'px';
    toggle.textContent = 'Collapse';
  } else {
    el.style.maxHeight = '160px';
    toggle.textContent = 'Show all';
  }
}
function setProblem(v=''){ const el=problemEl(); if(el) el.value=v; }
function getProblem(){ return problemEl()?.value?.trim() || ''; }
function getAnswer(){  return answerEl()?.value?.trim()  || ''; }

async function prefillFromStorage(){
  try{
    const obj = await store.get(KEY);
    if (obj && obj[KEY]){
      setProblem(obj[KEY]);
      await store.remove(KEY);
    }
  }catch(e){ console.warn('[W2Q] prefill failed', e); }
}

function wire(){
  $('#btnSteps')?.addEventListener('click', ()=>{
    try { stepsOut().textContent = ((window.W2Q||globalThis).generateSteps)(getProblem()); }
    catch(e){ stepsOut().textContent = 'Error: '+ e.message; }
  });
  $('#btnHint')?.addEventListener('click', ()=>{
    try { hintsOut().textContent = ((window.W2Q||globalThis).genHint)(getProblem()); }
    catch(e){ hintsOut().textContent = 'Error: '+ e.message; }
  });
  $('#btnCheck')?.addEventListener('click', ()=>{
    try { const {verdict}=((window.W2Q||globalThis).checkAnswer)(getProblem(), getAnswer()); answerOut().textContent = verdict; }
    catch(e){ answerOut().textContent = 'Error: '+ e.message; }
  });
}

document.addEventListener('DOMContentLoaded', async () => {

  // --- AI setup ---
  const aiToggle = document.querySelector('#aiToggle');
  const aiStatus = document.querySelector('#aiStatus');
  const btnExplain = document.querySelector('#btnExplain');
  const btnVariants = document.querySelector('#btnVariants');

  await initMode();

  async function refreshAI() {
    if (!window.W2Q || !window.W2Q.generateSteps) {
      // W2Q not ready yet; no-op
      return;
    }
    const state = await W2Q_AI.checkAvailability();
    aiStatus.textContent = state.available ? `AI: ${state.status}` : 'AI: unavailable';
    const on = W2Q_AI.isEnabled() && state.available;
    btnExplain.disabled = !on;
    btnVariants.disabled = !on;
    btnExplain.title = on ? '' : 'Enable AI in Settings';
    btnVariants.title = on ? '' : 'Enable AI in Settings';
  }

  aiToggle?.addEventListener('change', () => {
    W2Q_AI.setEnabled(aiToggle.checked);
    refreshAI();
  });

  // Explain this step (use the last line in Steps if present, else the rule)
  btnExplain?.addEventListener('click', async () => {
    const stepsBox = document.querySelector('#outSteps');
    const text = (stepsBox?.textContent || '').trim();
    const lines = text.split(/\n+/).filter(Boolean);
    const focus = lines[lines.length - 1] || 'Apply the order of operations.';
    try {
      btnExplain.disabled = true; btnExplain.textContent = 'Explaining…';
      const result = await W2Q_AI.explainStep(focus);
      const hintsBox = document.querySelector('#outHints');
      hintsBox.textContent = (hintsBox.textContent ? hintsBox.textContent + '\\n' : '') + 'Why: ' + result;
    } catch (e) {
      const hintsBox = document.querySelector('#outHints');
      hintsBox.textContent = 'AI error: ' + (e.message || e);
    } finally {
      btnExplain.textContent = 'Explain this step (AI)';
      refreshAI();
    }
  });

  // Generate printable variants (AI) -> for now just put the generated list into Steps; PDF export can be added later.
  btnVariants?.addEventListener('click', async () => {
    try {
      btnVariants.disabled = true; btnVariants.textContent = 'Generating…';
      const list = await W2Q_AI.generateVariants(getProblem(), 12);
      const stepsBox = document.querySelector('#outSteps');
      stepsBox.textContent = list;
    } catch (e) {
      const stepsBox = document.querySelector('#outSteps');
      stepsBox.textContent = 'AI error: ' + (e.message || e);
    } finally {
      btnVariants.textContent = 'Generate printable variants (AI)';
      refreshAI();
    }
  });

  const stepsToggle = document.querySelector('#stepsToggle');
  stepsToggle?.addEventListener('click', ()=>{
    const box=document.querySelector('#outSteps');
    if(!box) return;
    box.dataset.expanded = box.dataset.expanded === 'true' ? 'false' : 'true';
    updateExpandable(box, stepsToggle);
  });
  wire();
  await prefillFromStorage();
  refreshAI();
});

// --- Mode toggle wiring ---
const MODE_KEY = 'w2q_mode';

function setMode(mode, { persist = true } = {}) {
  const generalBtn = document.getElementById('mode-general');
  const mathBtn    = document.getElementById('mode-math');
  if (generalBtn) generalBtn.setAttribute('aria-selected', String(mode === 'general'));
  if (mathBtn)    mathBtn.setAttribute('aria-selected', String(mode === 'math'));
  document.body.dataset.mode = mode;
  if (persist && chrome?.storage?.sync) {
    try { chrome.storage.sync.set({ [MODE_KEY]: mode }); } catch {}
  }
}

async function initMode() {
  try {
    const saved = chrome?.storage?.sync ? await chrome.storage.sync.get(MODE_KEY) : {};
    setMode(saved[MODE_KEY] || 'general', { persist: false });
  } catch {
    setMode('general', { persist: false });
  }
  document.getElementById('mode-general')?.addEventListener('click', () => setMode('general'));
  document.getElementById('mode-math')?.addEventListener('click', () => setMode('math'));
  document.querySelector('.mode-toggle')?.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') setMode('math');
    if (e.key === 'ArrowLeft')  setMode('general');
  });
}

// Listen for changes in whichever storage bucket we used
(chrome.storage?.session || chrome.storage).onChanged.addListener((changes, area) => {
  if (changes[KEY]?.newValue) setProblem(changes[KEY].newValue);
});

// ----------------------------------------------
// W2Q: General Mode (append-only) — safe to paste
// at the END of extension/sidepanel.js
// ----------------------------------------------

// DOM refs (will be null if General section not present)
const genInput        = document.querySelector('#genInput');
const btnGenSummarize = document.querySelector('#genSummarize');
const btnGenRewrite   = document.querySelector('#genRewrite');
const selGenTone      = document.querySelector('#genTone');
const btnGenTranslate = document.querySelector('#genTranslate');
const selGenLang      = document.querySelector('#genLang');
const btnGenExtract   = document.querySelector('#genExtract');
const selGenExtract   = document.querySelector('#genExtractType');
const genOut          = document.querySelector('#genOut');

function getGeneralInput() { return (genInput?.value || '').trim(); }
function setGenOut(text)   { if (genOut) genOut.textContent = text ?? ''; }

// Flexible call surface for built-in AI or stubs
async function callGeneral(apiName, payload) {
  if (window.W2Q_AI?.[apiName]) return await window.W2Q_AI[apiName](payload);
  if (window.W2Q_AI?.general)   return await window.W2Q_AI.general(apiName, payload);
  if (window.W2Q_AI?.prompt)    return await window.W2Q_AI.prompt(JSON.stringify({ action: apiName, ...payload }));
  throw new Error('General AI not available in this build.');
}

// Button listeners (no-ops if buttons not present)
btnGenSummarize?.addEventListener('click', async () => {
  const text = getGeneralInput(); if (!text) return setGenOut('Paste or send some text first.');
  setGenOut('Summarizing...');
  try { setGenOut(String(await callGeneral('summarize', { text }) || '')); }
  catch (e) { setGenOut('Error: ' + (e?.message || e)); }
});

btnGenRewrite?.addEventListener('click', async () => {
  const text = getGeneralInput(); if (!text) return setGenOut('Paste or send some text first.');
  const tone = selGenTone?.value || 'friendly';
  setGenOut('Rewriting...');
  try { setGenOut(String(await callGeneral('rewrite', { text, tone }) || '')); }
  catch (e) { setGenOut('Error: ' + (e?.message || e)); }
});

btnGenTranslate?.addEventListener('click', async () => {
  const text = getGeneralInput(); if (!text) return setGenOut('Paste or send some text first.');
  const target = selGenLang?.value || 'es';
  setGenOut('Translating...');
  try { setGenOut(String(await callGeneral('translate', { text, target }) || '')); }
  catch (e) { setGenOut('Error: ' + (e?.message || e)); }
});

btnGenExtract?.addEventListener('click', async () => {
  const text = getGeneralInput(); if (!text) return setGenOut('Paste or send some text first.');
  const kind = selGenExtract?.value || 'highlights';
  setGenOut('Extracting...');
  try { setGenOut(String(await callGeneral('extract', { text, kind }) || '')); }
  catch (e) { setGenOut('Error: ' + (e?.message || e)); }
});

// Optional: prefill General from Math's problem if available and empty
try {
  if (genInput && !genInput.value && typeof getProblem === 'function') {
    const p = getProblem();
    if (p) genInput.value = p;
  }
} catch {}
