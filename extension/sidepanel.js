// --- AI availability probe & graceful fallback ---
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

  try {
    const s = await ai.canCreateTextSession();
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

// Listen for changes in whichever storage bucket we used
(chrome.storage?.session || chrome.storage).onChanged.addListener((changes, area) => {
  if (changes[KEY]?.newValue) setProblem(changes[KEY].newValue);
});
