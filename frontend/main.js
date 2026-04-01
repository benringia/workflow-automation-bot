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
