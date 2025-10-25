// --- prototype.js (v3.7: CSP-safe, clean, namespaced) ---
(function(g){
  'use strict';

  function normalizeExpr(expr='') {
    return (expr || '')
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-')
      .replace(/,/g, '')
      .trim();
  }

  function tokenize(s) {
    const tokens = [];
    let i = 0;
    while (i < s.length) {
      const ch = s[i];
      if (/\s/.test(ch)) { i++; continue; }
      if (/[()+\-*/]/.test(ch)) {
        if (ch === '-' && (tokens.length === 0 || /[+\-*/(]/.test(tokens[tokens.length-1]))) {
          tokens.push('u-');
        } else {
          tokens.push(ch);
        }
        i++; continue;
      }
      if (/\d|\./.test(ch)) {
        let j = i, dot = 0;
        while (j < s.length && /[\d.]/.test(s[j])) {
          if (s[j] === '.') { dot++; if (dot > 1) break; }
          j++;
        }
        const num = s.slice(i, j);
        if (!/^\d*\.?\d+$/.test(num)) return null;
        tokens.push(num);
        i = j; continue;
      }
      return null;
    }
    return tokens;
  }

  function evalSafe(expr) {
    const s = normalizeExpr(expr);
    if (!s) return NaN;
    const tokens = tokenize(s);
    if (!tokens) return NaN;

    const prec = { 'u-':3, '*':2, '/':2, '+':1, '-':1 };
    const rightAssoc = { 'u-': true };
    const out = [];
    const ops = [];

    function pop() {
      const op = ops.pop();
      if (op === 'u-') {
        const a = out.pop();
        out.push(-a);
      } else {
        const b = out.pop(), a = out.pop();
        if (a === undefined || b === undefined) throw new Error('bad expression');
        switch(op){
          case '+': out.push(a+b); break;
          case '-': out.push(a-b); break;
          case '*': out.push(a*b); break;
          case '/': out.push(a/b); break;
        }
      }
    }

    for (const t of tokens) {
      if (/^\d*\.?\d+$/.test(t)) {
        out.push(parseFloat(t));
      } else if (t in prec) {
        while (ops.length) {
          const top = ops[ops.length-1];
          if (top in prec && ((rightAssoc[t] && prec[t] < prec[top]) || (!rightAssoc[t] && prec[t] <= prec[top]))) {
            pop();
          } else break;
        }
        ops.push(t);
      } else if (t === '(') {
        ops.push(t);
      } else if (t === ')') {
        while (ops.length && ops[ops.length-1] !== '(') pop();
        if (ops.pop() !== '(') return NaN;
      } else {
        return NaN;
      }
    }
    while (ops.length) {
      if (ops[ops.length-1] === '(') return NaN;
      pop();
    }
    const res = out.pop();
    return (out.length === 0 && Number.isFinite(res)) ? res : NaN;
  }

  function generateSteps(expr='') {
    const s = normalizeExpr(expr);
    if (!s) return 'Enter or send a problem first.';
    const steps = [];
    steps.push(`Original: ${s}`);
    steps.push('Rule: Do multiplication and division before addition and subtraction.');

    // Avoid leaking partials across groups
    if (/[()]/.test(s)) return steps.join('\n');

    if (/[*\/]/.test(s)) {
      try {
        const mid = s.replace(/(-?\d+(?:\.\d+)?)\s*([*/])\s*(-?\d+(?:\.\d+)?)/g, (m,a,op,b)=> {
          const av = parseFloat(a), bv = parseFloat(b);
          return op === '*' ? (av*bv).toString() : (av/bv).toString();
        });
        if (mid !== s) steps.push(`After × and ÷: ${mid}`);
      } catch {}
    } else if (/[+\-]/.test(s)) {
      const m = s.match(/^\s*(-?\d+(?:\.\d+)?)\s*([+\-])\s*(-?\d+(?:\.\d+)?)/);
      if (m) {
        const a = parseFloat(m[1]), op = m[2], b = parseFloat(m[3]);
        const partial = (op === '+') ? (a + b) : (a - b);
        const tail = s.slice(m[0].length);
        const after = String(partial) + tail;
        steps.push(`After first +/−: ${after}`);
      }
    }
    return steps.join('\n');
  }

  function genHint(expr='') {
    const s = normalizeExpr(expr);
    if (!s) return 'Hint: enter a problem like 12 + 5 × 3 or (12 - 5) + 3.';
    const hints = ['Combine × and ÷ first, then + and − left-to-right.'];
    if (/(\()/.test(s)) hints.push('Work inside parentheses before anything else.');
    if (/[*\/]/.test(s) && /[+\-]/.test(s)) hints.push('Rewrite × as * and ÷ as / if needed.');
    return hints.join(' ');
  }

  function checkAnswer(expr='', answer='') {
    const expected = evalSafe(expr);
    if (!Number.isFinite(expected)) return { ok:false, verdict: 'Could not evaluate the problem.' };
    const a = parseFloat(String(answer).trim());
    if (!Number.isFinite(a)) return { ok:false, verdict: 'Please enter a numeric answer.' };
    const ok = Math.abs(a - expected) < 1e-9;
    return { ok, verdict: ok ? 'Correct ✔' : `Not equal: expected ${expected}, you entered ${a}` };
  }

  // Namespace export
  g.W2Q = g.W2Q || {};
  g.W2Q.normalizeExpr = normalizeExpr;
  g.W2Q.evalSafe      = evalSafe;
  g.W2Q.generateSteps = generateSteps;
  g.W2Q.genHint       = genHint;
  g.W2Q.checkAnswer   = checkAnswer;

})(globalThis);
