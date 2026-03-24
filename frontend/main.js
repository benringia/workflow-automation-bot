const STEP_NAMES = {
    'generate-feature': 'Generate',
    'debug':            'Analyze',
    'refactor':         'Refactor',
    'explain-code':     'Explain'
};

// Normalize backend step IDs to frontend IDs if they ever diverge
const STEP_ID_NORMALIZE = {
    'analyze':          'debug',
    'generate':         'generate-feature',
    'explain':          'explain-code'
};

const DEFAULT_STEPS = [
    { id: 'generate-feature', label: STEP_NAMES['generate-feature'], enabled: true },
    { id: 'debug',            label: STEP_NAMES['debug'],            enabled: true },
    { id: 'refactor',         label: STEP_NAMES['refactor'],         enabled: true },
    { id: 'explain-code',     label: STEP_NAMES['explain-code'],     enabled: true }
];

let steps = DEFAULT_STEPS.map(s => ({ ...s, status: 'pending', result: null }));
let selectedStep = null;
let workflowResults = [];

const sleep = ms => new Promise(r => setTimeout(r, ms));

function renderLargeOutput(text, el) {
    el.textContent = '';
    const chunkSize = 500;
    let i = 0;

    function appendChunk() {
        if (i >= text.length) return;
        el.textContent += text.slice(i, i + chunkSize);
        i += chunkSize;
        requestAnimationFrame(appendChunk);
    }

    appendChunk();
}

function isTruncated(text) {
    if (!text || text.length < 1000) return false;
    const trimmed = text.trim();
    return !trimmed.endsWith('}') &&
           !trimmed.endsWith('```') &&
           !trimmed.endsWith('.') &&
           !trimmed.endsWith('!') &&
           !trimmed.endsWith('?');
}

function renderSteps() {
    const container = document.getElementById('workflow');
    container.innerHTML = '';

    steps.forEach((step, i) => {
        if (i > 0) {
            const arrow = document.createElement('span');
            arrow.className = 'connector';
            arrow.textContent = '→';
            container.appendChild(arrow);
        }

        const card = document.createElement('div');
        const isSelected = selectedStep === step.id;
        card.className = [
            'step-card',
            step.enabled ? '' : 'disabled',
            step.status,
            isSelected ? 'selected' : ''
        ].filter(Boolean).join(' ');
        card.id = `card-${step.id}`;

        card.innerHTML = `
            <div class="card-top">
                <span class="step-label">${step.label}</span>
                <label class="toggle" title="${step.enabled ? 'Disable' : 'Enable'} step">
                    <input type="checkbox" ${step.enabled ? 'checked' : ''} data-id="${step.id}" />
                    <span class="toggle-track"></span>
                </label>
            </div>
            <span class="step-badge ${step.status}">${step.enabled ? step.status : 'off'}</span>
        `;

        card.addEventListener('click', e => {
            if (e.target.closest('.toggle')) return;
            selectStep(step.id);
        });

        card.querySelector('input[type="checkbox"]').addEventListener('change', e => {
            const target = steps.find(s => s.id === e.target.dataset.id);
            if (target) {
                target.enabled = e.target.checked;
                renderSteps();
            }
        });

        container.appendChild(card);
    });
}

function selectStep(id) {
    selectedStep = id;
    renderSteps();

    const step = steps.find(s => s.id === id);
    const label = document.getElementById('output-label');
    const pre = document.getElementById('output-pre');

    label.textContent = step ? step.label : '';

    if (!step) return;

    if (!step.enabled) {
        pre.textContent = 'Step is disabled.';
        pre.className = 'muted';
    } else if (step.result) {
        pre.className = step.status === 'error' ? 'error-text' : '';
        renderLargeOutput(step.result, pre);
        if (isTruncated(step.result)) {
            requestAnimationFrame(() => {
                pre.textContent += '\n\n[Warning: Response may be truncated]';
            });
        }
    } else if (step.status === 'running') {
        pre.textContent = 'Running...';
        pre.className = 'muted';
    } else {
        pre.textContent = 'No result yet.';
        pre.className = 'muted';
    }
}

function setStepStatus(id, status, result = null) {
    const step = steps.find(s => s.id === id);
    if (!step) return;
    step.status = status;
    if (result !== null) step.result = result;
    renderSteps();
    if (selectedStep === id) selectStep(id);
}

function parseSSEEvent(rawEvent, handlers) {
    let eventType = 'message';
    let dataLine = '';
    for (const line of rawEvent.split('\n')) {
        if (line.startsWith('event: ')) eventType = line.slice(7).trim();
        if (line.startsWith('data: '))  dataLine  = line.slice(6).trim();
    }
    if (!dataLine) return;
    try {
        handlers[eventType]?.(JSON.parse(dataLine));
    } catch { /* malformed data — skip */ }
}

async function readSSEStream(response, handlers) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
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

async function runWorkflowStream() {
    const input = document.getElementById('task-input').value.trim();
    const btn = document.getElementById('run-btn');
    if (!input) { document.getElementById('task-input').focus(); return; }

    btn.disabled = true;
    steps = steps.map(s => ({ ...s, status: 'pending', result: null }));
    selectedStep = null;
    renderSteps();

    const pre = document.getElementById('output-pre');
    const label = document.getElementById('output-label');
    label.textContent = '';
    pre.textContent = 'Detecting intent...';
    pre.className = 'muted';

    const streamBuffers = {};
    let firstStreamingStep = null;

    const handlers = {
        init({ intent, detectedSteps }) {
            pre.textContent = intent;
            steps.forEach(step => {
                if (!detectedSteps.includes(step.id)) {
                    step.status = 'done';
                    step.result = 'Step not required for this request.';
                }
            });
            renderSteps();
        },
        'step-start'({ step }) {
            streamBuffers[step] = '';
            setStepStatus(step, 'running');
            if (!firstStreamingStep) {
                firstStreamingStep = step;
                selectedStep = step;
                label.textContent = STEP_NAMES[step] || step;
                pre.textContent = '';
                pre.className = '';
                renderSteps();
            }
        },
        chunk({ step, chunk }) {
            streamBuffers[step] = (streamBuffers[step] || '') + chunk;
            if (selectedStep === step) {
                pre.textContent += chunk;
                document.querySelector('.output-box').scrollTop =
                    document.querySelector('.output-box').scrollHeight;
            }
        },
        'step-complete'({ step }) {
            setStepStatus(step, 'done', streamBuffers[step] || '');
        },
        'step-error'({ step, error }) {
            setStepStatus(step, 'error', `Error: ${error}`);
            if (selectedStep === step) {
                pre.textContent = `Error: ${error}`;
                pre.className = 'error-text';
            }
        },
        done() {
            btn.disabled = false;
        }
    };

    try {
        const response = await fetch('http://localhost:5000/route-stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ input })
        });
        if (!response.ok) throw new Error(`Server error: ${response.status}`);
        await readSSEStream(response, handlers);
    } catch (err) {
        console.error('Stream error:', err);
        pre.textContent = `Network error: ${err.message}`;
        pre.className = 'error-text';
        btn.disabled = false;
    }
}

renderSteps();

// Dev helper — paste into browser console to verify output panel isn't clipping:
// document.getElementById('output-pre').textContent = 'TEST\n'.repeat(200);
