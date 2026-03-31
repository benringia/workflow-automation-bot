# Frontend Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite `frontend/index.html` and `frontend/main.js` to produce a clean, production-grade UI that strictly separates Node Workflow and AI Pipeline modes, adds a tabbed output system for pipeline results, and improves output readability throughout.

**Architecture:** Two-file rewrite (no new files, no modules, no build step). HTML owns all structure and CSS via embedded `<style>`. JS is organized into clearly labelled sections and built incrementally across tasks. All existing API call logic, SSE stream handling, and output-formatting functions are preserved verbatim or with minimal adaptation.

**Tech Stack:** Vanilla JavaScript, HTML5, CSS custom properties. Backend endpoints unchanged: `POST /workflow/run`, `POST /workflow/generate` on Railway.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `frontend/index.html` | Full rewrite | HTML structure + all embedded CSS |
| `frontend/main.js` | Full rewrite | All client-side logic, organized in labelled sections |

**Section build order for `main.js`** — each task appends a section. Order matters to avoid forward-reference errors:

1. Config → State → DOM Refs → Utilities → Mode → Error → Loading
2. Output Formatting → Typing Engine  *(must precede Steps — `selectStep` calls `clearTyping` and `renderOutput`)*
3. Steps
4. Tabs
5. SSE Helpers → Node Workflow
6. Pipeline
7. Run Entry Point → Events → Init

---

## Task 1: Write `frontend/index.html`

**Files:**
- Rewrite: `frontend/index.html`

- [ ] **Step 1: Write the complete HTML file**

Replace the entire contents of `frontend/index.html` with:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AI Workflow Builder</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg-base:      #0f172a;
      --bg-card:      #1e293b;
      --bg-sunken:    #0f172a;
      --border:       #334155;
      --accent:       #7c3aed;
      --accent-light: #a78bfa;
      --text-primary: #e2e8f0;
      --text-muted:   #64748b;
      --green:        #86efac;
      --red:          #f87171;
      --amber:        #fbbf24;
    }

    html { min-height: 100vh; }

    body {
      background: var(--bg-base);
      color: var(--text-primary);
      font-family: 'Fira Code', 'Cascadia Code', Consolas, monospace;
      min-height: 100vh;
      padding: 32px 16px 64px;
    }

    /* Mode visibility — JS sets data-mode on <body> */
    [data-mode="node"]     #pipeline-section { display: none; }
    [data-mode="pipeline"] #node-section     { display: none; }

    /* ── Layout ── */
    .site-header { text-align: center; margin-bottom: 28px; }
    .site-header h1 {
      font-size: 1.4rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 6px;
    }
    .site-header .subtitle { color: var(--text-muted); font-size: 0.82rem; }

    .main-content {
      max-width: 720px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    /* ── Mode toggle ── */
    .mode-toggle {
      display: flex;
      background: var(--bg-sunken);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 4px;
      gap: 4px;
    }
    .mode-btn {
      flex: 1;
      padding: 8px 0;
      border: none;
      border-radius: 5px;
      background: transparent;
      color: var(--text-muted);
      font-family: inherit;
      font-size: 0.83rem;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
    }
    .mode-btn.active { background: var(--accent); color: #fff; }

    /* ── Cards ── */
    .card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px;
    }

    /* ── Input card ── */
    #task-input {
      width: 100%;
      background: var(--bg-sunken);
      border: 1px solid var(--border);
      border-radius: 6px;
      color: var(--text-primary);
      font-family: inherit;
      font-size: 0.85rem;
      padding: 12px;
      resize: none;
      min-height: 100px;
      outline: none;
      transition: border-color 0.15s;
      display: block;
    }
    #task-input:focus { border-color: var(--accent); }

    .input-actions { display: flex; justify-content: flex-end; margin-top: 10px; }

    .btn-primary {
      background: var(--accent);
      color: #fff;
      border: none;
      border-radius: 6px;
      padding: 9px 22px;
      font-family: inherit;
      font-size: 0.85rem;
      cursor: pointer;
      transition: opacity 0.15s;
    }
    .btn-primary:hover    { opacity: 0.88; }
    .btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }

    /* ── Error card ── */
    .error-card {
      background: #450a0a;
      border: 1px solid #7f1d1d;
      border-radius: 8px;
      padding: 12px 16px;
      color: var(--red);
      font-size: 0.83rem;
    }

    /* ── Section title ── */
    .section-title {
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-muted);
      margin-bottom: 10px;
    }

    /* ── Step list ── */
    .step-list { display: flex; flex-direction: column; gap: 8px; }

    .step-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px 14px;
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      transition: border-color 0.15s;
    }
    .step-card:hover    { border-color: #475569; }
    .step-card.selected { border-color: var(--accent); }
    .step-card.running  { border-color: var(--amber); }
    .step-card.done     { border-color: var(--green); }
    .step-card.error    { border-color: var(--red); }
    .step-card.disabled { opacity: 0.45; }
    .step-card.disabled:hover { border-color: var(--border); }

    .card-top { flex: 1; display: flex; align-items: center; gap: 10px; }
    .step-label { flex: 1; font-size: 0.88rem; font-weight: 600; color: var(--text-primary); }

    /* ── Badges ── */
    .badge {
      font-size: 0.68rem;
      padding: 2px 8px;
      border-radius: 999px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .badge-pending { background: var(--bg-sunken); color: var(--text-muted); border: 1px solid var(--border); }
    .badge-running { background: #451a03; color: var(--amber); animation: pulse 1.4s ease-in-out infinite; }
    .badge-done    { background: #14532d; color: var(--green); }
    .badge-error   { background: #450a0a; color: var(--red); }
    .badge-off     { background: var(--bg-sunken); color: var(--text-muted); border: 1px solid var(--border); }

    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

    /* ── Move buttons ── */
    .move-btns { display: flex; flex-direction: column; gap: 1px; flex-shrink: 0; }
    .move-btn {
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 0.62rem;
      line-height: 1;
      padding: 1px 4px;
      cursor: pointer;
      border-radius: 3px;
      font-family: inherit;
      transition: color 0.1s;
    }
    .move-btn:hover    { color: var(--text-primary); }
    .move-btn:disabled { opacity: 0; pointer-events: none; }

    /* ── Toggle switch ── */
    .toggle {
      position: relative;
      display: inline-flex;
      align-items: center;
      cursor: pointer;
      flex-shrink: 0;
    }
    .toggle input { position: absolute; opacity: 0; width: 0; height: 0; }
    .toggle-track {
      display: block;
      width: 28px;
      height: 16px;
      border-radius: 999px;
      background: var(--border);
      position: relative;
      transition: background 0.2s;
    }
    .toggle-track::after {
      content: '';
      position: absolute;
      top: 2px; left: 2px;
      width: 12px; height: 12px;
      border-radius: 50%;
      background: var(--text-muted);
      transition: transform 0.2s, background 0.2s;
    }
    .toggle input:checked + .toggle-track        { background: var(--accent); }
    .toggle input:checked + .toggle-track::after { transform: translateX(12px); background: #fff; }

    /* ── Pipeline section ── */
    #pipeline-section { display: flex; flex-direction: column; }

    .tab-bar {
      display: flex;
      background: var(--bg-sunken);
      border: 1px solid var(--border);
      border-bottom: none;
      border-radius: 8px 8px 0 0;
      padding: 4px;
      gap: 4px;
    }
    .tab-btn {
      flex: 1;
      padding: 6px 0;
      border: none;
      border-radius: 5px;
      background: transparent;
      color: var(--text-muted);
      font-family: inherit;
      font-size: 0.8rem;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
    }
    .tab-btn.active { background: var(--accent); color: #fff; }

    .tab-panels {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 0 0 8px 8px;
      min-height: 180px;
    }
    .tab-panel        { display: none; padding: 16px; }
    .tab-panel.active { display: block; }

    /* ── Code blocks ── */
    .code-block { margin: 8px 0; }
    .code-block pre {
      background: var(--bg-sunken);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 12px;
      overflow-x: auto;
      font-family: inherit;
      font-size: 0.78rem;
      line-height: 1.6;
      color: var(--text-primary);
      max-height: 400px;
      overflow-y: auto;
      white-space: pre;
    }
    .toggle-btn {
      background: #1e1b3a;
      border: 1px solid var(--accent);
      color: var(--accent-light);
      border-radius: 5px;
      padding: 4px 10px;
      font-family: inherit;
      font-size: 0.75rem;
      cursor: pointer;
      margin-bottom: 4px;
    }
    .toggle-btn:hover { background: #2d1b6e; }
    .hidden { display: none !important; }

    /* ── Output card (node mode) ── */
    #output-section .card { overflow: hidden; }
    .output-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--border);
    }
    #output-step-name { font-size: 0.88rem; font-weight: 600; color: var(--text-primary); }

    .output-body {
      max-height: 420px;
      overflow-y: auto;
      font-size: 0.83rem;
      line-height: 1.7;
      color: var(--text-primary);
      white-space: pre-wrap;
      word-break: break-word;
    }
    .output-body.muted { color: var(--text-muted); }
    .output-body .output-section             { margin-bottom: 18px; line-height: 1.65; }
    .output-body .output-section h2,
    .output-body .output-section h3          { font-size: 0.88rem; color: var(--accent-light); margin-bottom: 6px; }

    @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
    .output-body.streaming::after {
      content: '\u2588';
      color: var(--accent);
      animation: blink 0.8s step-start infinite;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .output-body.fade-in { animation: fadeIn 0.2s ease-out; }

    /* ── Validation ── */
    .validation-progress      { margin-bottom: 16px; }
    .validation-progress-label {
      display: flex;
      justify-content: space-between;
      color: var(--text-muted);
      font-size: 0.78rem;
      margin-bottom: 5px;
    }
    .progress-bar-track { background: var(--bg-sunken); border-radius: 4px; height: 6px; overflow: hidden; }
    .progress-bar-fill {
      height: 100%;
      border-radius: 4px;
      background: linear-gradient(90deg, var(--accent), var(--accent-light));
      transition: width 0.4s ease;
    }
    .validation-list { list-style: none; display: flex; flex-direction: column; }
    .validation-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 7px 0;
      border-bottom: 1px solid var(--border);
      font-size: 0.83rem;
    }
    .validation-item:last-child { border-bottom: none; }
    .validation-icon {
      width: 20px; height: 20px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.65rem;
      flex-shrink: 0;
    }
    .validation-icon.pass { background: #14532d; color: var(--green); }
    .validation-icon.fail { background: #450a0a; color: var(--red); }
    .validation-rule { color: var(--text-muted); }

    /* ── Helpers ── */
    .empty-state { color: var(--text-muted); font-size: 0.83rem; text-align: center; padding: 28px 0; }
    .muted       { color: var(--text-muted); }
    .error-text  { color: var(--red); }
  </style>
</head>
<body data-mode="node">

  <header class="site-header">
    <h1>AI Workflow Builder</h1>
    <p class="subtitle">Describe a task — intent is detected automatically</p>
  </header>

  <main class="main-content">

    <!-- Mode toggle -->
    <div class="mode-toggle" role="group" aria-label="Execution mode">
      <button class="mode-btn active" id="btn-node">Node Workflow</button>
      <button class="mode-btn"        id="btn-pipeline">AI Pipeline</button>
    </div>

    <!-- Input card -->
    <div class="card input-card">
      <textarea
        id="task-input"
        placeholder="Describe your task or paste code&#8230;"
        aria-label="Task input"
      ></textarea>
      <div class="input-actions">
        <button id="run-btn" class="btn-primary">&#9654; Run Workflow</button>
      </div>
    </div>

    <!-- Error card (hidden by default) -->
    <div class="error-card" id="error-card" hidden>
      <span id="error-message"></span>
    </div>

    <!-- Node section -->
    <section id="node-section" aria-label="Workflow steps">
      <h2 class="section-title">Steps</h2>
      <div class="step-list" id="step-list"></div>
    </section>

    <!-- Pipeline section -->
    <section id="pipeline-section" aria-label="AI Pipeline output">
      <div class="tab-bar" role="tablist" aria-label="Output tabs">
        <button class="tab-btn active" data-tab="code"       role="tab" aria-selected="true" >Code</button>
        <button class="tab-btn"        data-tab="docs"       role="tab" aria-selected="false">Docs</button>
        <button class="tab-btn"        data-tab="tests"      role="tab" aria-selected="false">Tests</button>
        <button class="tab-btn"        data-tab="validation" role="tab" aria-selected="false">Validation</button>
      </div>
      <div class="tab-panels">
        <div class="tab-panel active" id="panel-code"       role="tabpanel"><p class="empty-state">Run a pipeline to see generated code.</p></div>
        <div class="tab-panel"        id="panel-docs"       role="tabpanel"><p class="empty-state">Run a pipeline to see generated docs.</p></div>
        <div class="tab-panel"        id="panel-tests"      role="tabpanel"><p class="empty-state">Run a pipeline to see generated tests.</p></div>
        <div class="tab-panel"        id="panel-validation" role="tabpanel"><p class="empty-state">Run a pipeline to see validation results.</p></div>
      </div>
    </section>

    <!-- Output section (node mode results) -->
    <section id="output-section" hidden aria-label="Step output">
      <div class="card">
        <div class="output-header">
          <span id="output-step-name"></span>
          <span id="output-status-badge" class="badge badge-pending">pending</span>
        </div>
        <div class="output-body muted" id="output-body" aria-live="polite">
          Click a step to view output.
        </div>
      </div>
    </section>

  </main>

  <script src="main.js"></script>
</body>
</html>
```

- [ ] **Step 2: Verify static render**

Open `frontend/index.html` in a browser. Confirm:
- Dark background, centered column (~720px wide), title + subtitle visible
- Mode toggle shows two buttons; "Node Workflow" has purple background
- Input textarea and "▶ Run Workflow" button visible
- Error card is hidden (not visible)
- Step list area is visible but empty (JS not yet wired)
- Pipeline section is hidden (body has `data-mode="node"`)
- Output section is hidden

- [ ] **Step 3: Commit**

```bash
git add frontend/index.html
git commit -m "feat: rewrite index.html with redesigned layout and CSS design system"
```

---

## Task 2: Create `main.js` — Foundation (Config through Loading)

**Files:**
- Rewrite: `frontend/main.js`

- [ ] **Step 1: Write the foundation of `main.js`**

Replace the entire contents of `frontend/main.js` with:

```javascript
// ─────────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const API_BASE = 'https://workflow-automation-bot-production-8cec.up.railway.app';

const STEP_NAMES = {
    'generate-feature': 'Generate Feature',
    'debug':            'Debug',
    'refactor':         'Refactor',
    'explain-code':     'Explain Code'
};

const STEP_NODE_TYPE = {
    'generate-feature': 'ai.generate',
    'debug':            'ai.debug',
    'refactor':         'ai.refactor',
    'explain-code':     'ai.explain'
};

const PIPELINE_RULES = ['no console logs', 'use async/await'];

// ─────────────────────────────────────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────────────────────────────────────
let mode = 'node';
let steps = [
    { id: 'generate-feature', label: STEP_NAMES['generate-feature'], enabled: true, status: 'pending', result: null },
    { id: 'debug',            label: STEP_NAMES['debug'],            enabled: true, status: 'pending', result: null },
    { id: 'refactor',         label: STEP_NAMES['refactor'],         enabled: true, status: 'pending', result: null },
    { id: 'explain-code',     label: STEP_NAMES['explain-code'],     enabled: true, status: 'pending', result: null }
];
let selectedStep = null;
let activeTab    = 'code';
let isRunning    = false;

// ─────────────────────────────────────────────────────────────────────────────
// DOM REFS
// ─────────────────────────────────────────────────────────────────────────────
const btnNode        = document.getElementById('btn-node');
const btnPipeline    = document.getElementById('btn-pipeline');
const taskInput      = document.getElementById('task-input');
const runBtn         = document.getElementById('run-btn');
const errorCard      = document.getElementById('error-card');
const errorMessage   = document.getElementById('error-message');
const stepListEl     = document.getElementById('step-list');
const outputSection  = document.getElementById('output-section');
const outputStepName = document.getElementById('output-step-name');
const outputBadge    = document.getElementById('output-status-badge');
const outputBody     = document.getElementById('output-body');
const tabBtns        = document.querySelectorAll('.tab-btn');

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────
function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ─────────────────────────────────────────────────────────────────────────────
// MODE
// ─────────────────────────────────────────────────────────────────────────────
function setMode(m) {
    mode = m;
    document.body.dataset.mode = m;
    btnNode.classList.toggle('active', m === 'node');
    btnPipeline.classList.toggle('active', m === 'pipeline');
    runBtn.textContent = m === 'pipeline' ? '\u25BA Generate Outputs' : '\u25BA Run Workflow';
    clearError();
    outputSection.hidden = true;
    outputBody.textContent = '';
    if (m === 'node') {
        steps = steps.map(s => ({ ...s, status: 'pending', result: null }));
        selectedStep = null;
        renderSteps(); // defined in Task 3
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ERROR STATE
// ─────────────────────────────────────────────────────────────────────────────
function showError(msg) {
    errorMessage.textContent = msg;
    errorCard.hidden = false;
}

function clearError() {
    errorCard.hidden = true;
    errorMessage.textContent = '';
}

// ─────────────────────────────────────────────────────────────────────────────
// LOADING STATE
// ─────────────────────────────────────────────────────────────────────────────
function setLoading(active) {
    isRunning = active;
    runBtn.disabled = active;
    if (active) {
        runBtn.textContent = '\u23F3 Running\u2026';
        clearError();
    } else {
        runBtn.textContent = mode === 'pipeline' ? '\u25BA Generate Outputs' : '\u25BA Run Workflow';
    }
}
```

- [ ] **Step 2: Verify in browser console**

Open the browser console. Confirm:
- No errors on page load
- `typeof setMode` → `"function"`, `typeof setLoading` → `"function"`
- Run `setMode('pipeline')` → mode toggle switches to "AI Pipeline" (purple on right), step list section hides, pipeline section appears
- Run `setLoading(true)` → button shows "⏳ Running…" and is disabled
- Run `setLoading(false)` → button re-enables with "▶ Generate Outputs"
- Do **not** call `setMode('node')` yet — `renderSteps` is not defined until Task 3

---

## Task 3: Add Output Formatting and Typing Engine to `main.js`

**Files:**
- Modify: `frontend/main.js` (append)

*This section must be added before Task 4 (Steps) because `selectStep()` calls `clearTyping()` and `renderOutput()`.*

- [ ] **Step 1: Append OUTPUT FORMATTING and TYPING ENGINE sections**

Add the following to the **end** of `frontend/main.js`:

```javascript
// ─────────────────────────────────────────────────────────────────────────────
// OUTPUT FORMATTING
// ─────────────────────────────────────────────────────────────────────────────
function renderCodeBlocks(escaped) {
    return escaped.replace(/```(\w*)?\n([\s\S]*?)```/g, (_, lang, code) =>
        `<div class="code-block">` +
        `<button class="toggle-btn">Hide Code</button>` +
        `<pre><code class="lang-${lang || ''}">${code}</code></pre>` +
        `</div>`
    );
}

function formatOutput(text) {
    const lines    = text.split('\n');
    const sections = [];
    let current    = null;

    for (const line of lines) {
        const match = line.match(/^(#{1,2})\s+(.+)/);
        if (match) {
            if (current) sections.push(current);
            current = { title: match[2], level: match[1].length, lines: [] };
        } else {
            if (!current) current = { title: null, lines: [] };
            current.lines.push(line);
        }
    }
    if (current) sections.push(current);

    return sections.map(section => {
        const content = renderCodeBlocks(escapeHtml(section.lines.join('\n')));
        if (section.title) {
            const tag = section.level === 1 ? 'h2' : 'h3';
            return `<div class="output-section"><${tag}>${escapeHtml(section.title)}</${tag}><div>${content}</div></div>`;
        }
        return `<div class="output-section"><div>${content}</div></div>`;
    }).join('');
}

function isTruncated(text) {
    if (!text || text.length < 1000) return false;
    const t = text.trim();
    return !t.endsWith('}') && !t.endsWith('```') && !t.endsWith('.') && !t.endsWith('!') && !t.endsWith('?');
}

function renderOutput(text, el) {
    el.classList.remove('streaming');
    el.innerHTML = formatOutput(text);
    if (isTruncated(text)) {
        el.innerHTML += '<span class="muted">\n\n[Response may be truncated]</span>';
    }
    el.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const pre    = btn.nextElementSibling;
            const hidden = pre.classList.toggle('hidden');
            btn.textContent = hidden ? 'Show Code' : 'Hide Code';
        });
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPING ENGINE (node mode only)
// ─────────────────────────────────────────────────────────────────────────────
let typingQueue        = '';
let typingActive       = false;
let typingAborted      = false;
let charsRendered      = 0;
let typingDoneCallback = null;

function clearTyping() {
    typingAborted      = true;
    typingActive       = false;
    typingQueue        = '';
    charsRendered      = 0;
    typingDoneCallback = null;
    outputBody.classList.remove('streaming');
}

function enqueueText(text, onDone) {
    typingAborted      = false;
    typingDoneCallback = onDone || null;
    typingQueue       += text;
    if (!typingActive) processQueue();
}

function processQueue() {
    if (typingAborted || typingQueue.length === 0) {
        typingActive = false;
        if (!typingAborted && typingDoneCallback) {
            const cb = typingDoneCallback;
            typingDoneCallback = null;
            cb();
        }
        return;
    }
    typingActive = true;
    if (outputBody.textContent.length > 15000) {
        outputBody.textContent = outputBody.textContent.slice(-15000);
    }
    outputBody.textContent += typingQueue[0];
    typingQueue = typingQueue.slice(1);
    charsRendered++;
    if (charsRendered % 20 === 0) {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' });
    }
    setTimeout(processQueue, 5);
}
```

- [ ] **Step 2: Smoke-test formatting in browser console**

In the browser console, run:

```javascript
document.getElementById('output-section').hidden = false;
renderOutput('## Hello\nThis is a test.\n\n```js\nconsole.log("hi")\n```\n', document.getElementById('output-body'));
```

Expected: Section heading "Hello" styled in purple, paragraph text, and a code block with a "Hide Code" / "Show Code" toggle button. Clicking the toggle hides/shows the code block.

---

## Task 4: Add Step List to `main.js`

**Files:**
- Modify: `frontend/main.js` (append)

- [ ] **Step 1: Append the STEPS section**

Add the following to the **end** of `frontend/main.js`:

```javascript
// ─────────────────────────────────────────────────────────────────────────────
// STEPS (node mode)
// ─────────────────────────────────────────────────────────────────────────────
function renderSteps() {
    stepListEl.innerHTML = '';
    steps.forEach((step, i) => {
        const card = document.createElement('div');
        card.className = [
            'step-card',
            step.enabled ? '' : 'disabled',
            step.status !== 'pending' ? step.status : '',
            selectedStep === step.id ? 'selected' : ''
        ].filter(Boolean).join(' ');
        card.id = `card-${step.id}`;

        const badgeClass = step.enabled ? `badge-${step.status}` : 'badge-off';
        const badgeText  = step.enabled ? step.status : 'off';

        card.innerHTML = `
            <div class="card-top">
                <span class="step-label">${step.label}</span>
                <span class="badge ${badgeClass}">${badgeText}</span>
                <div class="move-btns">
                    <button class="move-btn" data-move="up"   data-id="${step.id}" title="Move up"   ${i === 0 ? 'disabled' : ''}>&#9650;</button>
                    <button class="move-btn" data-move="down" data-id="${step.id}" title="Move down" ${i === steps.length - 1 ? 'disabled' : ''}>&#9660;</button>
                </div>
                <label class="toggle" title="${step.enabled ? 'Disable' : 'Enable'} step">
                    <input type="checkbox" ${step.enabled ? 'checked' : ''} data-id="${step.id}" />
                    <span class="toggle-track"></span>
                </label>
            </div>
        `;

        card.addEventListener('click', e => {
            if (e.target.closest('.toggle') || e.target.closest('.move-btns')) return;
            selectStep(step.id);
        });

        card.querySelectorAll('.move-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                moveStep(btn.dataset.id, btn.dataset.move);
            });
        });

        card.querySelector('input[type="checkbox"]').addEventListener('change', e => {
            const target = steps.find(s => s.id === e.target.dataset.id);
            if (target) { target.enabled = e.target.checked; renderSteps(); }
        });

        stepListEl.appendChild(card);
    });
}

function moveStep(id, direction) {
    const idx = steps.findIndex(s => s.id === id);
    if (idx === -1) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= steps.length) return;
    [steps[idx], steps[swapIdx]] = [steps[swapIdx], steps[idx]];
    renderSteps();
}

function setStepStatus(id, status, result = null) {
    const step = steps.find(s => s.id === id);
    if (!step) return;
    step.status = status;
    if (result !== null) step.result = result;
    renderSteps();
    if (selectedStep === id) selectStep(id);
}

function selectStep(id) {
    clearTyping();
    selectedStep = id;
    renderSteps();

    const step = steps.find(s => s.id === id);
    outputSection.hidden = false;
    outputStepName.textContent = step ? step.label : '';
    outputBadge.className  = `badge badge-${step?.status || 'pending'}`;
    outputBadge.textContent = step?.status || 'pending';

    if (!step) return;

    if (!step.enabled) {
        outputBody.className = 'output-body muted';
        outputBody.textContent = 'Step is disabled.';
    } else if (step.result) {
        outputBody.className = `output-body fade-in${step.status === 'error' ? ' error-text' : ''}`;
        renderOutput(step.result, outputBody);
    } else if (step.status === 'running') {
        outputBody.className = 'output-body muted';
        outputBody.textContent = 'Running\u2026';
    } else {
        outputBody.className = 'output-body muted';
        outputBody.textContent = 'No result yet.';
    }
}

// Bootstrap
renderSteps();
```

- [ ] **Step 2: Verify step list in browser**

Reload the page. Confirm:
- Four step cards appear (Generate Feature, Debug, Refactor, Explain Code)
- Toggle switches are checked and turn purple when enabled; unchecking fades the card and shows "off" badge
- ▲ is hidden on first card; ▼ is hidden on last card
- Clicking ▲/▼ reorders the cards
- Clicking a card unhides `#output-section` and shows the step name in the header with "No result yet." in the body

---

## Task 5: Add Tab System to `main.js`

**Files:**
- Modify: `frontend/main.js` (append before Bootstrap line)

- [ ] **Step 1: Insert TABS section**

Find the last two lines at the bottom of `main.js`:
```javascript
// Bootstrap
renderSteps();
```

Insert the following **before** those two lines:

```javascript
// ─────────────────────────────────────────────────────────────────────────────
// TABS (pipeline mode)
// ─────────────────────────────────────────────────────────────────────────────
function setActiveTab(tab) {
    activeTab = tab;
    tabBtns.forEach(btn => {
        const isActive = btn.dataset.tab === tab;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', String(isActive));
    });
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.toggle('active', panel.id === `panel-${tab}`);
    });
}
```

- [ ] **Step 2: Add tab click listeners to Bootstrap section**

Replace the existing Bootstrap lines at the very bottom with:

```javascript
// Bootstrap
renderSteps();
setMode('node');
tabBtns.forEach(btn => btn.addEventListener('click', () => setActiveTab(btn.dataset.tab)));
```

- [ ] **Step 3: Verify tabs in browser**

Reload the page. Switch to AI Pipeline mode. Confirm:
- Four tab pills are visible: Code, Docs, Tests, Validation
- "Code" pill has purple background by default
- Clicking "Docs" → Docs pill turns purple, Docs panel shows empty-state, Code panel hides
- All four panels show their empty-state placeholder text

---

## Task 6: Add SSE Helpers and Node Workflow Execution to `main.js`

**Files:**
- Modify: `frontend/main.js` (append before Bootstrap section)

- [ ] **Step 1: Insert SSE HELPERS and NODE WORKFLOW sections**

Insert the following before the `// Bootstrap` comment at the bottom of `main.js`:

```javascript
// ─────────────────────────────────────────────────────────────────────────────
// SSE HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function parseSSEEvent(rawEvent, handlers) {
    let eventType = 'message';
    let dataLine  = '';
    for (const line of rawEvent.split('\n')) {
        if (line.startsWith('event: ')) eventType = line.slice(7).trim();
        if (line.startsWith('data: '))  dataLine  = line.slice(6).trim();
    }
    if (!dataLine) return;
    try { handlers[eventType]?.(JSON.parse(dataLine)); } catch { /* malformed — skip */ }
}

async function readSSEStream(response, handlers) {
    const reader  = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer    = '';
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let boundary;
        while ((boundary = buffer.indexOf('\n\n')) !== -1) {
            parseSSEEvent(buffer.slice(0, boundary), handlers);
            buffer = buffer.slice(boundary + 2);
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// NODE WORKFLOW
// ─────────────────────────────────────────────────────────────────────────────
function buildActiveNodes() {
    const nodes       = [];
    const nodeStepMap = {};
    steps
        .filter(s => s.enabled)
        .forEach((s, i) => {
            const id = String(i + 1);
            nodes.push({ id, type: STEP_NODE_TYPE[s.id] });
            nodeStepMap[id] = s.id;
        });
    return { nodes, nodeStepMap };
}

async function runNodeWorkflow() {
    const input = taskInput.value.trim();
    if (!input) { taskInput.focus(); return; }

    const { nodes, nodeStepMap } = buildActiveNodes();
    if (nodes.length === 0) {
        showError('Enable at least one step to run the workflow.');
        return;
    }

    setLoading(true);
    steps = steps.map(s => ({ ...s, status: 'pending', result: null }));
    selectedStep         = null;
    outputSection.hidden = true;
    renderSteps();

    const activeIds = new Set(Object.values(nodeStepMap));
    steps.forEach(s => {
        if (!activeIds.has(s.id)) setStepStatus(s.id, 'done', 'Step not required.');
    });
    nodes.forEach(node => setStepStatus(nodeStepMap[node.id], 'running'));

    try {
        const response = await fetch(`${API_BASE}/workflow/run`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ nodes, input })
        });
        if (!response.ok) throw new Error(`Server error: ${response.status}`);
        const data = await response.json();
        if (!data.success) throw new Error(data.error || 'Workflow failed');

        let firstStep = null;
        nodes.forEach(node => {
            const stepId = nodeStepMap[node.id];
            const result = data.results?.[node.id];
            if (result?.output) {
                setStepStatus(stepId, 'done', result.output);
                if (!firstStep) firstStep = stepId;
            } else {
                setStepStatus(stepId, 'error', result?.error || 'No output');
            }
        });

        if (firstStep) {
            const step = steps.find(s => s.id === firstStep);
            selectedStep           = firstStep;
            outputSection.hidden   = false;
            outputStepName.textContent = step.label;
            outputBadge.className  = 'badge badge-done';
            outputBadge.textContent = 'done';
            outputBody.className   = 'output-body streaming';
            outputBody.textContent = '';
            clearTyping();
            enqueueText(step.result, () => {
                renderOutput(step.result, outputBody);
                outputBody.className = 'output-body fade-in';
            });
            renderSteps();
        }
    } catch (err) {
        console.error('Workflow error:', err);
        showError(err.message);
        steps.forEach(s => {
            if (s.status === 'running') setStepStatus(s.id, 'error', 'Workflow ended unexpectedly');
        });
    } finally {
        setLoading(false);
    }
}
```

- [ ] **Step 2: Test node workflow with backend**

Start the backend:

```bash
node backend/server.js
```

In Node Workflow mode, type `build a rate limiter middleware` and click **▶ Run Workflow**. Confirm:
- Button shows "⏳ Running…" while the request is in flight
- Step cards animate from "pending" → "running" (amber, pulsing)
- On completion: step cards show green "done" or red "error" badges
- First step's output appears with the character-by-character typing animation
- Clicking a different step card switches the output panel content

---

## Task 7: Add Pipeline Execution to `main.js`

**Files:**
- Modify: `frontend/main.js` (append before Bootstrap section)

- [ ] **Step 1: Insert PIPELINE section**

Insert the following before the `// Bootstrap` comment at the bottom of `main.js`:

```javascript
// ─────────────────────────────────────────────────────────────────────────────
// PIPELINE
// ─────────────────────────────────────────────────────────────────────────────
function clearTabPanels() {
    ['code', 'docs', 'tests', 'validation'].forEach(tab => {
        document.getElementById(`panel-${tab}`).innerHTML = `<p class="empty-state">Generating\u2026</p>`;
    });
}

function renderPipelinePanel(tab, content) {
    const panel = document.getElementById(`panel-${tab}`);
    if (content) {
        panel.innerHTML = formatOutput(content);
        panel.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const pre    = btn.nextElementSibling;
                const hidden = pre.classList.toggle('hidden');
                btn.textContent = hidden ? 'Show Code' : 'Hide Code';
            });
        });
    } else {
        panel.innerHTML = `<p class="empty-state">Not generated.</p>`;
    }
}

function renderValidation(validation) {
    const panel    = document.getElementById('panel-validation');
    const allRules = validation ? Object.values(validation).flat() : [];

    if (allRules.length === 0) {
        panel.innerHTML = `<p class="empty-state">No validation rules defined.</p>`;
        return;
    }

    const passed = allRules.filter(r => r.status === 'PASS').length;
    const total  = allRules.length;
    const pct    = Math.round((passed / total) * 100);

    const listItems = allRules.map(r => {
        const pass = r.status === 'PASS';
        return `
            <li class="validation-item">
                <span class="validation-icon ${pass ? 'pass' : 'fail'}">${pass ? '&#10003;' : '&#10007;'}</span>
                <span class="validation-rule">${escapeHtml(r.rule)}</span>
            </li>`;
    }).join('');

    panel.innerHTML = `
        <div class="validation-progress">
            <div class="validation-progress-label">
                <span>${passed} of ${total} rules passed</span>
                <span>${pct}%</span>
            </div>
            <div class="progress-bar-track">
                <div class="progress-bar-fill" style="width: ${pct}%"></div>
            </div>
        </div>
        <ul class="validation-list">${listItems}</ul>`;
}

function renderPipelineResult(result) {
    const { outputs = {}, validation } = result;
    renderPipelinePanel('code',  outputs.code);
    renderPipelinePanel('docs',  outputs.docs);
    renderPipelinePanel('tests', outputs.tests);
    renderValidation(validation);
    setActiveTab('code');
}

async function runPipeline() {
    const input = taskInput.value.trim();
    if (!input) { taskInput.focus(); return; }

    setLoading(true);
    clearTabPanels();
    setActiveTab('code');

    try {
        const res = await fetch(`${API_BASE}/workflow/generate`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ data: { description: input }, rules: PIPELINE_RULES })
        });
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const result = await res.json();
        if (!result.success) throw new Error(result.error || 'Pipeline failed');
        renderPipelineResult(result);
    } catch (err) {
        console.error('Pipeline error:', err);
        showError(err.message);
        ['code', 'docs', 'tests', 'validation'].forEach(tab => {
            document.getElementById(`panel-${tab}`).innerHTML =
                `<p class="error-text">Error: ${escapeHtml(err.message)}</p>`;
        });
    } finally {
        setLoading(false);
    }
}
```

- [ ] **Step 2: Test pipeline with backend**

Backend must still be running. Switch to **AI Pipeline** mode. Type `build a user authentication system` and click **▶ Generate Outputs**. Confirm:
- All four tab panels show "Generating…" during the request
- On completion: Code tab auto-activates with formatted output
- Clicking Docs/Tests tabs shows their generated content
- Validation tab shows a progress bar and rule list with green ✓ / red ✗ icons
- Empty tabs show "Not generated." placeholder

---

## Task 8: Wire Run Entry Point and Final Events

**Files:**
- Modify: `frontend/main.js` (replace Bootstrap section)

- [ ] **Step 1: Replace the Bootstrap section at the bottom of `main.js`**

Find the three lines currently at the very bottom of `main.js`:
```javascript
// Bootstrap
renderSteps();
setMode('node');
tabBtns.forEach(btn => btn.addEventListener('click', () => setActiveTab(btn.dataset.tab)));
```

Replace them with:

```javascript
// ─────────────────────────────────────────────────────────────────────────────
// RUN ENTRY POINT
// ─────────────────────────────────────────────────────────────────────────────
function runWorkflow() {
    if (isRunning) return;
    mode === 'pipeline' ? runPipeline() : runNodeWorkflow();
}

// ─────────────────────────────────────────────────────────────────────────────
// EVENTS
// ─────────────────────────────────────────────────────────────────────────────
btnNode.addEventListener('click',     () => setMode('node'));
btnPipeline.addEventListener('click', () => setMode('pipeline'));
runBtn.addEventListener('click',      runWorkflow);
taskInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) runWorkflow();
});
tabBtns.forEach(btn => btn.addEventListener('click', () => setActiveTab(btn.dataset.tab)));

// ─────────────────────────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────────────────────────
renderSteps();
setMode('node');
```

- [ ] **Step 2: Verify Ctrl+Enter shortcut**

Focus the textarea, type any text, press **Ctrl+Enter** (Windows/Linux) or **Cmd+Enter** (Mac). Confirm the run fires (button briefly shows "⏳ Running…").

- [ ] **Step 3: Verify double-submit guard**

While a run is in flight, click the run button multiple times. Confirm only one request fires (check the Network tab in DevTools — there should be exactly one pending request).

- [ ] **Step 4: Verify mode-switch clears state**

1. Run a node workflow, wait for output
2. Click "AI Pipeline" → confirm output section disappears, step statuses reset to "pending"
3. Switch back to "Node Workflow" → confirm step cards are reset with "pending" badges

---

## Task 9: End-to-End Verification and Final Commit

- [ ] **Step 1: Full node workflow test**

1. In Node Workflow mode, type: `build a rate limiter for an Express API`
2. Disable the "Refactor" step using its toggle
3. Click **▶ Run Workflow**
4. Verify:
   - Disabled step shows faded appearance and "off" badge
   - Active steps animate through "running" → "done"/"error"
   - Output section appears with typing animation for the first step
   - Clicking other step cards switches the output panel content
   - Output has formatted headings and collapsible code blocks

- [ ] **Step 2: Full pipeline test**

1. Switch to AI Pipeline mode
2. Type: `create a TypeScript function to validate an email address`
3. Click **▶ Generate Outputs**
4. Verify:
   - All four tabs show "Generating…" during request
   - Code tab auto-selected on completion with formatted output
   - Docs, Tests, Validation tabs all have content
   - Validation tab shows progress bar and rule rows with icons

- [ ] **Step 3: Edge case checklist**

| Scenario | How to trigger | Expected result |
|---|---|---|
| Empty input | Click run with empty textarea | Textarea focuses; no request fires |
| All steps disabled | Uncheck all toggles, click run | Red error card: "Enable at least one step" |
| Rapid clicks | Click run 5× in quick succession | Only one request fires |
| Network error | DevTools → Network → Offline, then run | Red error card with message; button re-enables |
| Null pipeline content | Backend returns `outputs.docs = null` | Docs tab shows "Not generated." |
| No validation rules | Backend returns `validation = {}` | Validation tab shows "No validation rules defined." |

- [ ] **Step 4: Final commit**

```bash
git add frontend/index.html frontend/main.js
git commit -m "feat: redesign frontend with separated modes, tabbed pipeline output, and improved UX"
```
