// ---- helpers ----
const $ = (s) => document.querySelector(s);

const normalize = (txt = '') =>
  (txt || '')
    .replace(/[^\S\r\n]+/g, ' ')
    .replace(/[\u2012\u2013\u2014\u2015\u2212]/g, '-')
    .replace(/[\u2010\u2011]/g, '-')
 
  .replace(/[\u00D7\u2715\u2716\u00B7]/g, '*')
    .replace(/[\u00F7\u2044\u2215]/g, '/')
    
      .replace(/\b[xX]\b/g, '*').replace(/[\u2795]/g, '+')
    .trim();

const sanitize = (expr='') => {
  expr = normalize(expr);
  // remove leading words like "solve", etc.
  expr = expr.replace(/(?:solve|evaluate|compute|find|what is|=\s*\?|\?)/gi,'').trim();
  // allow linear "ax + b = c" with x
  if (/=/.test(expr) && /x/.test(expr) && !/[a-wy-zA-WY-Z]/.test(expr)) return expr;
  // else keep only safe chars
  return expr.replace(/[^0-9+\-*/().^\s]/g,'').trim();
};

const safeEval = (expr) => {
  const e = expr.replace(/\^/g,'**'); // caret → exponent
  if (!/^[-+/*()0-9.\s*]+$/.test(e)) throw new Error('Unsafe');
  if (/^\s*[*/]/.test(e)) throw new Error('Malformed');
  if (/[+\-*/]{3,}/.test(e)) throw new Error('Malformed');
  const fn = new Function('return ('+e+')');
  const v = fn();
  if (typeof v !== 'number' || !isFinite(v)) throw new Error('Bad result');
  return v;
};

const fmt = (n) => Number.isInteger(n) ? String(n) : String(Math.round(n*1000)/1000);

// solve ax + b = c
const solveLinear = (eq) => {
  const s = normalize(eq);
  const m = s.match(/^\s*([\-+]?\d*(?:\.\d+)?)\s*\*?\s*x\s*([+\-]\s*\d+(?:\.\d+)?)?\s*=\s*([\-+]?\d+(?:\.\d+)?)\s*$/i);
  if (!m) return null;
  const a = m[1] === '' || m[1] === '+' || m[1] == null ? 1 : Number(m[1]);
  const b = m[2] ? Number(m[2].replace(/\s+/g,'')) : 0;
  const c = Number(m[3]);
  const x = (c - b) / a;
  return { a,b,c,x };
};

// build steps for arithmetic or simple linear
const stepsFor = (expr) => {
  expr = sanitize(expr);
  const lin = solveLinear(expr);
  if (lin) {
    const {a,b,c,x} = lin;
    const steps = [];
    if (b!==0) steps.push(`Subtract ${fmt(b)} from both sides: ${fmt(a)}x = ${fmt(c-b)}`);
    if (a!==1) steps.push(`Divide both sides by ${fmt(a)}: x = ${fmt((c-b)/a)}`);
    steps.push(`Solution: x = ${fmt(x)}`);
    return { steps, answer:x };
  }

  let work = expr;
  const steps = [];

  // evaluate parentheses first
  const paren = /\(([^()]+)\)/;
  let guard = 0;
  while (paren.test(work) && guard < 20) {
    const m = work.match(paren);
    const inside = m[1];
    const val = safeEval(inside);
    steps.push(`Evaluate (${inside}) = ${fmt(val)}`);
    work = work.replace(paren, String(val));
    guard++;
  }
  if (guard >= 20) throw new Error('Loop guard');

  const evalMatch = (re, label) => {
    const m = work.match(re);
    if (!m) return false;
    const a = parseFloat(m[1]);
    const op = m[2];                   // <-- FIX: operator is group 2
    const b = parseFloat(m[3]);
    let val = 0;
    if (op === '*') val = a*b;
    else if (op === '/') val = a/b;
    else if (op === '+') val = a+b;
    else if (op === '-') val = a-b;
    steps.push(`${label}: ${fmt(a)} ${op} ${fmt(b)} = ${fmt(val)}`);
    work = work.replace(m[0], String(val));
    return true;
  };

  guard = 0;
  while (/[*/]/.test(work) && guard < 30) {
    if (!evalMatch(/(-?\d+(?:\.\d+)?)\s*([*/])\s*(-?\d+(?:\.\d+)?)/, 'Multiply/Divide')) break;
    guard++;
  }
  guard = 0;
  while (/[+\-]/.test(work) && /-?\d/.test(work) && guard < 30) {
    if (!evalMatch(/(-?\d+(?:\.\d+)?)\s*([+\-])\s*(-?\d+(?:\.\d+)?)/, 'Add/Subtract')) break;
    guard++;
  }

  const answer = safeEval(expr);
  steps.push(`Result: ${fmt(answer)}`);
  return { steps, answer };
};

const hintsFor = (expr) => {
  const base = [
    "Underline what the question is asking.",
    "Circle the numbers and operators you will use.",
    "Compute parentheses first, then ×/÷, then +/− (left to right).",
    "Estimate to sanity-check your final answer."
  ];
  if (/=/.test(expr) && /x/.test(expr)) base.unshift("Isolate x by undoing +/− first, then ×/÷.");
  if (/\//.test(expr) || /÷/.test(expr)) base.push("Dividing by a number equals multiplying by its reciprocal.");
  return base;
};

const buildVariants = (expr, n=6) => {
  expr = normalize(expr);
  const nums = [...expr.matchAll(/(-?\d+(?:\.\d+)?)/g)].map(m => ({v:m[0]}));
  if (!nums.length) return [];
  const out = [];
  for (let i=0;i<n;i++){
    let e = expr;
    nums.forEach((num, idx) => {
      const base = parseFloat(num.v);
      const delta = (i%2===0?1:-1) * (1 + ((i+idx)%3));
      e = e.replace(num.v, fmt(base + delta));
    });
    let ans = null, lin=null;
    if (/=/.test(e) && /x/.test(e)) { lin = solveLinear(e); ans = lin? lin.x : null; }
    else { try { ans = safeEval(sanitize(e)); } catch { ans = null; } }
    out.push({expr:e, answer: ans});
  }
  return out;
};

const printable = (title, baseExpr, vars) => {
  const w = window.open('', '_blank');
  const items = vars.map((v,i)=>`<li><b>Problem ${i+1}:</b> ${v.expr}</li>`).join('');
  const answers = vars.map((v,i)=>`<li>Problem ${i+1}: <b>${v.answer ?? '—'}</b></li>`).join('');
  const css = "body{font:16px/1.45 ui-sans-serif,system-ui,Segoe UI,Roboto} .sheet{max-width:760px;margin:24px auto;padding:24px;border:1px solid #ddd;border-radius:12px}";
  w.document.write(`<!doctype html><meta charset="utf-8"><title>${title}</title><style>${css}</style><div class="sheet"><h1>${title}</h1><p>Base: ${baseExpr}</p><ol>${items}</ol><hr><h2>Answer Key</h2><ol>${answers}</ol></div>`);
  w.document.close();
};

// ---- wire UI ----
$("#btnSteps").addEventListener("click", () => {
  const p = $("#problem").value.trim();
  if (!p) return;
  try {
    const {steps} = stepsFor(p);
    const ol = $("#stepsOut"); ol.innerHTML = "";
    steps.forEach(s => { const li = document.createElement("li"); li.textContent = s; ol.appendChild(li); });
  } catch {
    $("#stepsOut").innerHTML = "<li>Could not parse. Try a simpler expression.</li>";
  }
});

$("#btnHint").addEventListener("click", () => {
  const p = $("#problem").value.trim();
  const ul = $("#hintsOut"); ul.innerHTML = "";
  hintsFor(p).forEach(h => { const li = document.createElement("li"); li.textContent = h; ul.appendChild(li); });
});

$("#btnCheck").addEventListener("click", () => {
  const p = $("#problem").value.trim();
  const a = parseFloat($("#answer").value.trim());
  const box = $("#result");
  let expected = null;
  try {
    const lin = solveLinear(p);
    expected = lin ? lin.x : safeEval(sanitize(p));
  } catch {}
  if (expected == null || Number.isNaN(a)) {
    box.textContent = "Unable to check. Make sure the input and your answer are numeric / linear in x.";
    return;
  }
  box.textContent = Math.abs(a - expected) <= 1e-6
    ? `✅ Correct! Answer = ${fmt(expected)}`
    : `✗ Not quite. Expected ${fmt(expected)} (you entered ${$("#answer").value}).`;
});

$("#btnVariants").addEventListener("click", () => {
  const p = $("#problem").value.trim();
  if (!p) return;
  const vars = buildVariants(p, 6);
  if (!vars.length) return;
  printable("Math Wars Meta — Teacher Pack", p, vars);
});

// Prefill for a fun first run
$("#problem").value = "12 + 5 × 3";

// Receive selection from background → sidepanel
window.addEventListener("message", (e) => {
  if (!e.data || e.data.type !== "W2Q_SELECTION") return;
  const t = (e.data.text || "").trim();
  if (t) $("#problem").value = t;
});



