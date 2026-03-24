const API_BASE = 'https://workflow-automation-bot-production-8cec.up.railway.app';

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

function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderCodeBlocks(escaped) {
    return escaped.replace(/```(\w*)?\n([\s\S]*?)```/g, (_, lang, code) =>
        `<div class="code-block">` +
        `<button class="toggle-btn">Show Code</button>` +
        `<pre class="hidden"><code class="lang-${lang || ''}">${code}</code></pre>` +
        `</div>`
    );
}

function formatOutput(text) {
    const lines = text.split('\n');
    const sections = [];
    let current = null;

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

// --- Typing engine ---
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
    document.getElementById('output-pre').classList.remove('streaming');
}

function enqueueText(text) {
    typingQueue += text;
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
    const pre = document.getElementById('output-pre');
    if (pre.textContent.length > 15000) {
        pre.textContent = pre.textContent.slice(-15000);
    }
    pre.textContent += typingQueue[0];
    typingQueue = typingQueue.slice(1);
    charsRendered++;
    if (charsRendered % 20 === 0) {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' });
    }
    setTimeout(processQueue, 5);
}

function renderOutput(text, el) {
    el.classList.remove('streaming');
    el.innerHTML = formatOutput(text);
    if (isTruncated(text)) {
        el.innerHTML += '<span class="muted">\n\n[Warning: Response may be truncated]</span>';
    }
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

function moveStep(id, direction) {
    const idx = steps.findIndex(s => s.id === id);
    if (idx === -1) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= steps.length) return;
    [steps[idx], steps[swapIdx]] = [steps[swapIdx], steps[idx]];
    renderSteps();
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
                <div class="move-btns">
                    <button class="move-btn" data-move="up" data-id="${step.id}" title="Move up" ${i === 0 ? 'disabled' : ''}>▲</button>
                    <button class="move-btn" data-move="down" data-id="${step.id}" title="Move down" ${i === steps.length - 1 ? 'disabled' : ''}>▼</button>
                </div>
                <label class="toggle" title="${step.enabled ? 'Disable' : 'Enable'} step">
                    <input type="checkbox" ${step.enabled ? 'checked' : ''} data-id="${step.id}" />
                    <span class="toggle-track"></span>
                </label>
            </div>
            <span class="step-badge ${step.status}">${step.enabled ? step.status : 'off'}</span>
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
            if (target) {
                target.enabled = e.target.checked;
                renderSteps();
            }
        });

        container.appendChild(card);
    });
}

function selectStep(id) {
    clearTyping();
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
        renderOutput(step.result, pre);
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

const STEP_NODE_TYPE = {
    'generate-feature': 'ai.generate',
    'debug':            'ai.debug',
    'refactor':         'ai.refactor',
    'explain-code':     'ai.explain'
};

function buildActiveNodes() {
    const nodes = [];
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

async function runWorkflowStream() {
    const input = document.getElementById('task-input').value.trim();
    const btn = document.getElementById('run-btn');
    if (!input) { document.getElementById('task-input').focus(); return; }

    const { nodes, nodeStepMap } = buildActiveNodes();
    const activeStepIds = new Set(Object.values(nodeStepMap));

    if (nodes.length === 0) {
        document.getElementById('output-pre').textContent = 'Enable at least one step to run the workflow.';
        document.getElementById('output-pre').className = 'muted';
        return;
    }

    btn.disabled = true;
    steps = steps.map(s => ({ ...s, status: 'pending', result: null }));
    selectedStep = null;
    renderSteps();

    const pre = document.getElementById('output-pre');
    const label = document.getElementById('output-label');
    label.textContent = '';
    pre.textContent = 'Running workflow...';
    pre.className = 'muted';

    // Mark disabled steps as skipped
    steps.forEach(s => {
        if (!activeStepIds.has(s.id)) setStepStatus(s.id, 'done', 'Step not required for this request.');
    });

    // Mark active nodes as running
    nodes.forEach(node => setStepStatus(nodeStepMap[node.id], 'running'));

    try {
        const response = await fetch(`${API_BASE}/workflow/run`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nodes, input })
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
            selectedStep = firstStep;
            label.textContent = STEP_NAMES[firstStep] || firstStep;
            pre.className = 'fade-in';
            clearTyping();
            typingDoneCallback = () => {
                const step = steps.find(s => s.id === firstStep);
                if (step?.result) renderOutput(step.result, pre);
            };
            enqueueText(steps.find(s => s.id === firstStep)?.result || '');
            renderSteps();
        }
    } catch (err) {
        clearTyping();
        console.error('Workflow error:', err);
        pre.textContent = `Error: ${err.message}`;
        pre.className = 'error-text';
    } finally {
        btn.disabled = false;
        steps.forEach(step => {
            if (step.status === 'running') setStepStatus(step.id, 'error', 'Workflow ended unexpectedly');
        });
    }
}

renderSteps();

document.getElementById('output-pre').addEventListener('click', e => {
    const btn = e.target.closest('.toggle-btn');
    if (!btn) return;
    const pre = btn.nextElementSibling;
    const nowHidden = pre.classList.toggle('hidden');
    btn.textContent = nowHidden ? 'Show Code' : 'Hide Code';
});

// Dev helper — paste into browser console to verify output panel isn't clipping:
// document.getElementById('output-pre').textContent = 'TEST\n'.repeat(200);
