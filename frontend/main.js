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
        renderSteps(); // defined in Task 4
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
