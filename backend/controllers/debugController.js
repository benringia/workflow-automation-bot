const fs = require('fs');
const path = require('path');
const claudeService = require('../services/claudeService');

/**
 * Handles debugging requests by injecting code and context into a prompt template.
 * Works with JSON bodies or raw text bodies by safely extracting input.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
async function handleDebug(req, res) {
    let code = null;

    // Extract input safely based on request format
    if (typeof req.body === "string") {
        code = req.body;
    } else if (req.body && typeof req.body.code === "string") {
        code = req.body.code;
    }

    // Validation: Code must be present and must be a string
    if (!code || typeof code !== "string") {
        return res.status(400).json({ 
            success: false, 
            error: "Code is required" 
        });
    }

    // Trim input
    const cleanedCode = code.trim();

    try {
        // Resolve path to debug prompt template
        const promptPath = path.join(__dirname, '../../prompts/debug.md');

        if (!fs.existsSync(promptPath)) {
            console.error("Prompt file not found at:", promptPath);
            return res.status(500).json({
                success: false,
                error: "Debug prompt template not found."
            });
        }

        // Read the prompt template
        let promptTemplate = fs.readFileSync(promptPath, 'utf8');

        const finalPrompt = promptTemplate.replace('{{code_snippet_or_error}}', cleanedCode);

        // Call AI service with formatted prompt and handle potential failures
        const aiResponse = await claudeService.sendPrompt(finalPrompt);

        // Return the AI generated result
        res.json({
            success: true,
            result: aiResponse
        });

    } catch (error) {
        console.error('Debug Controller Error:', error.message, error.response?.data || '');
        res.status(500).json({
            success: false,
            error: error.message || 'An error occurred while processing the debug request.',
            details: error.response?.data || null
        });
    }
}

module.exports = {
    handleDebug
};
