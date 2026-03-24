const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { sendPrompt } = require('./claudeService');

const NODE_TYPE_MAP = {
    'ai.generate':  { file: 'generate-feature.md', placeholder: '{{feature_description}}' },
    'ai.debug':     { file: 'debug.md',             placeholder: '{{code_snippet_or_error}}' },
    'ai.refactor':  { file: 'refactor.md',          placeholder: '{{code_snippet}}' },
    'ai.explain':   { file: 'explain-code.md',      placeholder: '{{code_snippet}}' }
};

function buildPrompt(type, input) {
    const config = NODE_TYPE_MAP[type];
    if (!config) throw new Error(`Unknown node type: ${type}`);
    const promptPath = path.join(__dirname, `../../prompts/${config.file}`);
    if (!fs.existsSync(promptPath)) throw new Error(`Prompt template not found: ${config.file}`);
    const template = fs.readFileSync(promptPath, 'utf-8');
    const re = new RegExp(config.placeholder.replace(/[{}]/g, '\\$&'), 'g');
    return template.replace(re, input);
}

function topoSort(nodes, edges) {
    const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));
    const inDegree = Object.fromEntries(nodes.map(n => [n.id, 0]));
    const children = Object.fromEntries(nodes.map(n => [n.id, []]));

    for (const { from, to } of edges) {
        if (inDegree[to] !== undefined) inDegree[to]++;
        if (children[from]) children[from].push(to);
    }

    const queue = nodes.filter(n => inDegree[n.id] === 0).map(n => n.id);
    const order = [];

    while (queue.length) {
        const id = queue.shift();
        order.push(nodeMap[id]);
        for (const childId of children[id]) {
            if (--inDegree[childId] === 0) queue.push(childId);
        }
    }

    return order;
}

function httpRequest(url, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        const parsed = new URL(url);
        const lib = parsed.protocol === 'https:' ? https : http;
        const options = {
            hostname: parsed.hostname,
            port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
            path: parsed.pathname + parsed.search,
            method: method.toUpperCase(),
            headers: body ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } : {}
        };
        const req = lib.request(options, res => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => resolve(data));
        });
        req.on('error', reject);
        if (body) req.write(body);
        req.end();
    });
}

async function executeNode(node, nodeInput) {
    const { type, config = {} } = node;

    if (type.startsWith('ai.')) {
        const prompt = buildPrompt(type, nodeInput);
        return await sendPrompt(prompt);
    }

    if (type === 'http.request') {
        const { url, method = 'GET' } = config;
        if (!url) throw new Error('http.request node requires config.url');
        const body = method.toUpperCase() !== 'GET' ? JSON.stringify({ input: nodeInput }) : null;
        return await httpRequest(url, method, body);
    }

    if (type === 'delay') {
        const ms = Math.min(Number(config.ms) || 1000, 10000);
        await new Promise(r => setTimeout(r, ms));
        return nodeInput;
    }

    if (type === 'condition') {
        const { contains, onTrue = nodeInput, onFalse = nodeInput } = config;
        if (!contains) throw new Error('condition node requires config.contains');
        return nodeInput.includes(contains) ? onTrue : onFalse;
    }

    throw new Error(`Unknown node type: ${type}`);
}

async function runWorkflow(nodes, input, edges = []) {
    const results = {};
    const sorted = edges.length ? topoSort(nodes, edges) : nodes;

    const parentOf = {};
    for (const { from, to } of edges) {
        parentOf[to] = from;
    }

    for (const node of sorted) {
        const parent = parentOf[node.id];
        const nodeInput = parent && results[parent]?.output
            ? results[parent].output
            : input;

        try {
            const output = await executeNode(node, nodeInput);
            results[node.id] = { output };
        } catch (err) {
            results[node.id] = { error: err.message };
            break;
        }
    }

    return results;
}

module.exports = { runWorkflow };
