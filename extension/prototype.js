// prototype.js — Math tab logic (MV3-safe; no eval)

(function () {
  const $ = (s) => document.querySelector(s);
  const problem = $('#problem');
  const answer  = $('#answer');
  const stepsEl = $('#steps');
  const hintsEl = $('#hints');
  const result  = $('#result');

  const btnSteps    = $('#btnSteps');
  const btnHint     = $('#btnHint');
  const btnCheck    = $('#btnCheck');
  const btnVariants = $('#btnVariants');

  // --- shunting-yard parser (+, -, *, /, parentheses; supports × ÷ chars) ---
  function normalize(expr) {
    return (expr || '')
      .replace(/[×xX]/g, '*')
      .replace(/÷/g, '/')
      .replace(/–|—/g, '-')
      .replace(/[^0-9+\-*/().\s]/g, '');
  }
  function tokenize(expr) {
    const src = normalize(expr).trim();
    const tokens = [];
    const num = /^(?:\d+(?:\.\d*)?|\.\d+)/;
    let i = 0;
    while (i < src.length) {
      const c = src[i];
      if (/\s/.test(c)) { i++; continue; }
      if ('+-*/()'.includes(c)) {
        if (c === '-') {
          const prev = tokens[tokens.length - 1];
          if (!prev || (prev.type === 'op' && prev.value !== ')') || (prev.type === 'paren' && prev.value === '(')) {
            tokens.push({ type: 'num', value: 0 });
            tokens.push({ type: 'op', value: '-' });
            i++; continue;
          }
        }
        tokens.push(c === '(' || c === ')' ? { type: 'paren', value: c } : { type: 'op', value: c });
        i++; continue;
      }
      const m = src.slice(i).match(num);
      if (m) { tokens.push({ type: 'num', value: parseFloat(m[0]) }); i += m[0].length; continue; }
      return null;
    }
    return tokens;
  }
  const prec = { '+':1, '-':1, '*':2, '/':2 };
  function toRPN(tokens) {
    if (!tokens) return null;
    const out = [], ops = [];
    for (const t of tokens) {
      if (t.type === 'num') out.push(t);
      else if (t.type === 'op') {
        while (ops.length && ops[ops.length-1].type === 'op' && prec[ops[ops.length-1].value] >= prec[t.value]) out.push(ops.pop());
        ops.push(t);
      } else if (t.type === 'paren' && t.value === '(') ops.push(t);
      else if (t.type === 'paren' && t.value === ')') {
        let found = false;
        while (ops.length) { const k = ops.pop(); if (k.type === 'paren' && k.value === '(') { found = true; break; } out.push(k); }
        if (!found) return null;
      }
    }
    while (ops.length) { const k = ops.pop(); if (k.type === 'paren') return null; out.push(k); }
    return out;
  }
  function evalRPN(rpn) {
    if (!rpn) return NaN;
    const st = [];
    for (const t of rpn) {
      if (t.type === 'num') st.push(t.value);
      else if (t.type === 'op') {
        const b = st.pop(), a = st.pop(); if (a === undefined || b === undefined) return NaN;
        st.push(t.value === '+' ? a + b :
                t.value === '-' ? a - b :
                t.value === '*' ? a * b :
                t.value === '/' ? (b === 0 ? NaN : a / b) : NaN);
      }
    }
    return st.length === 1 ? st[0] : NaN;
  }
  function evaluate(expr) { return evalRPN(toRPN(tokenize(expr))); }

  // --- UI helpers
  function setList(listEl, items) {
    listEl.innerHTML = '';
    (items || []).forEach(t => { const li = document.createElement('li'); li.textContent = t; listEl.appendChild(li); });
  }
  function showResult(ok, msg) {
    result.style.display = 'block';
    result.className = 'out ' + (ok ? 'ok' : 'no');
    result.textContent = msg;
  }

  // --- actions
  btnSteps?.addEventListener('click', () => {
    const expr = problem.value || '';
    const items = [];
    if (/[()]/.test(expr)) items.push('Evaluate any parentheses first.');
    if (/[*/×÷]/.test(expr)) items.push('Compute all multiplication and division from left to right.');
    if (/[+\-]/.test(expr))  items.push('Then compute addition and subtraction from left to right.');
    // (No "Final value" here — reserved for Check answer.)
    setList(stepsEl, items);
  });

  btnHint?.addEventListener('click', () => {
    const expr = problem.value || '';
    const items = [
      'Remember PEMDAS: Parentheses → Exponents → Multiply/Divide → Add/Subtract.',
      'Replace “×” with * and “÷” with / if typing.',
      'Work from left to right for operations with the same priority.',
    ];
    if (/\d+\s*[×xX*]\s*\d+/.test(expr)) items.unshift('Compute multiplication parts first.');
    setList(hintsEl, items);
  });

  btnCheck?.addEventListener('click', () => {
    const want = Number(answer.value);
    const got  = evaluate(problem.value);
    if (!Number.isFinite(got)) { showResult(false, 'The problem could not be parsed. Please check the expression.'); return; }
    const ok = Math.abs(want - got) < 1e-9;
    showResult(ok, ok ? 'Correct!' : `Not quite. The correct answer is ${got}.`);
  });

  btnVariants?.addEventListener('click', () => {
    const base = normalize(problem.value) || '12 + 5 * 3';
    const variants = [
      base.replace(/\b12\b/, '10'),
      base.replace(/\b5\b/, '6'),
      base.replace(/\b3\b/, '4'),
    ];
    setList(hintsEl, variants.map(v => `Try: ${v}`));
  });

  problem?.addEventListener('input', () => { result.style.display = 'none'; });
  answer ?.addEventListener('input', () => { result.style.display = 'none'; });
})();
