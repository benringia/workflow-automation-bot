const fs = require('fs');
const path = require('path');
const { sendPrompt } = require('../services/claudeService');

async function handleGenerateFeature(req, res) {
    console.log('[generateFeatureController] handleGenerateFeature called');
    const { feature } = req.body || {};

    if (!feature || typeof feature !== 'string') {
        return res.status(400).json({ success: false, error: 'Feature is required' });
    }

    try {
        const promptPath = path.join(__dirname, '../../prompts/generate-feature.md');

        if (!fs.existsSync(promptPath)) {
            return res.status(500).json({ success: false, error: 'Generate feature prompt template not found.' });
        }

        const template = fs.readFileSync(promptPath, 'utf-8');
        const finalPrompt = template.replace('{{feature_description}}', feature.trim());

        const result = await sendPrompt(finalPrompt);

        res.json({ success: true, result });
    } catch (error) {
        console.error('Generate Feature Error:', error);
        res.status(500).json({ success: false, error: error.message, details: error.response?.data || null });
    }
}

module.exports = { handleGenerateFeature };
