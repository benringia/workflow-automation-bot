const { runWorkflow } = require('../services/nodeEngine');
const { generate } = require('../services/multiOutputService');
const { validateAll } = require('../services/validationService');

async function handleWorkflowRun(req, res) {
    const { nodes, edges = [], input } = req.body || {};

    if (!Array.isArray(nodes) || nodes.length === 0) {
        return res.status(400).json({ success: false, error: 'nodes must be a non-empty array' });
    }
    if (!input || typeof input !== 'string') {
        return res.status(400).json({ success: false, error: 'input is required' });
    }

    try {
        const results = await runWorkflow(nodes, input, edges);
        res.json({ success: true, results });
    } catch (err) {
        console.error('[workflowController]', err.message, err.response?.data || '');
        res.status(500).json({ success: false, error: err.message });
    }
}

async function handleWorkflowGenerate(req, res) {
    const { data, rules } = req.body || {};

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return res.status(400).json({ success: false, error: 'data must be a non-null object' });
    }
    if (!data.description || typeof data.description !== 'string' || !data.description.trim()) {
        return res.status(400).json({ success: false, error: 'data.description is required and must be a non-empty string' });
    }
    if (rules !== undefined && !Array.isArray(rules)) {
        return res.status(400).json({ success: false, error: 'rules must be an array if provided' });
    }

    try {
        const { outputs, errors } = await generate(data, rules);
        const validation = validateAll(outputs, rules);
        const response = { success: true, outputs, validation };
        if (Object.keys(errors).length > 0) response.errors = errors;
        res.json(response);
    } catch (err) {
        console.error('[workflowController] handleWorkflowGenerate:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
}

module.exports = { handleWorkflowRun, handleWorkflowGenerate };
