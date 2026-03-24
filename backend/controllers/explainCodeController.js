const fs = require('fs');
const path = require('path');
const { sendPrompt } = require('../services/claudeService');

async function handleExplainCode(req, res) {
    const { code } = req.body || {};

    if (!code || typeof code !== 'string') {
        return res.status(400).json({ success: false, error: 'Code is required' });
    }

    try {
        const promptPath = path.join(__dirname, '../../prompts/explain-code.md');

        if (!fs.existsSync(promptPath)) {
            return res.status(500).json({ success: false, error: 'Explain code prompt template not found.' });
        }

        const template = fs.readFileSync(promptPath, 'utf-8');
        const finalPrompt = template.replace('{{code_snippet}}', code.trim());

        const result = await sendPrompt(finalPrompt);

        res.json({ success: true, result });
    } catch (error) {
        console.error('Explain Code Controller Error:', error);
        res.status(500).json({ success: false, error: error.message, details: error.response?.data || null });
    }
}

module.exports = { handleExplainCode };
