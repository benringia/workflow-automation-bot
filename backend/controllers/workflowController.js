const { runWorkflow } = require('../services/nodeEngine');

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

module.exports = { handleWorkflowRun };
