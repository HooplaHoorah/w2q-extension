// --- ai-stubs.js (v0.2.0-skeleton) ---
// Feature-flagged OFF by default. Provides wrappers around Chrome built-in AI Prompt API (Gemini Nano)
// and a placeholder "writer" flow. Fails gracefully if not available or not enabled.

const W2Q_AI = (() => {
  let enabled = false;          // toggled from the Settings checkbox
  let session = null;           // text session (Prompt API)
  const state = { available: false, status: 'disabled' };

  async function checkAvailability() {
    try {
      // Chrome built-in Prompt API (Gemini Nano)
      const cap = await (window.ai?.canCreateTextSession?.() || Promise.resolve({ available: 'no' }));
      state.available = (cap?.available === 'readily' || cap?.available === 'after-download');
      state.status = state.available ? cap.available : 'unavailable';
    } catch (e) {
      state.available = false;
      state.status = 'error';
    }
    return state;
  }

  async function ensureSession() {
    if (!enabled) throw new Error('AI features are disabled in Settings.');
    if (!state.available) throw new Error('AI is not available on this device.');
    if (session) return session;
    if (!window.ai?.createTextSession) throw new Error('Prompt API not supported in this build of Chrome.');
    session = await window.ai.createTextSession({ temperature: 0.2 });
    return session;
  }

  async function explainStep(stepText) {
    const s = await ensureSession();
    const prompt = `Explain the following arithmetic step in one short sentence, focusing on the rule used (no final answers):\n\n${stepText}`;
    const out = await s.prompt(prompt);
    return String(out).trim();
  }

  // Placeholder "writer" using the same session; switch to Writer API when available in your channel.
  async function generateVariants(problem, count = 12) {
    const s = await ensureSession();
    const prompt = `Create ${count} practice arithmetic problems similar in skill to: ${problem}\n` +
      `Return them as a plain numbered list. Do not include answers.`;
    const out = await s.prompt(prompt);
    return String(out).trim();
  }

  function setEnabled(v) {
    enabled = !!v;
  }

  function isEnabled() { return enabled; }

  return { checkAvailability, setEnabled, isEnabled, explainStep, generateVariants, state };
})();
