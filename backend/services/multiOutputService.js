const fs = require('fs');
const path = require('path');
const { sendPrompt } = require('./claudeService');

const OUTPUT_CONFIG = {
    code:  { file: 'generate-code.md' },
    docs:  { file: 'generate-docs.md' },
    tests: { file: 'generate-tests.md' }
};

function buildPrompt(outputType, data, rules) {
    const { file } = OUTPUT_CONFIG[outputType];
    const promptPath = path.join(__dirname, `../../prompts/${file}`);

    if (!fs.existsSync(promptPath)) {
        throw new Error(`Prompt template not found: ${file}`);
    }

    const template = fs.readFileSync(promptPath, 'utf-8');
    const rulesText = rules && rules.length ? rules.map(r => `- ${r}`).join('\n') : 'None';

    return template
        .replace(/\{\{description\}\}/g, data.description || '')
        .replace(/\{\{language\}\}/g,    data.language    || '')
        .replace(/\{\{context\}\}/g,     data.context     || '')
        .replace(/\{\{rules\}\}/g,       rulesText);
}

async function generate(data, rules = []) {
    const outputs = {};
    const errors  = {};

    for (const outputType of ['code', 'docs', 'tests']) {
        try {
            const prompt = buildPrompt(outputType, data, rules);
            outputs[outputType] = await sendPrompt(prompt);
        } catch (err) {
            console.error(`[multiOutputService] ${outputType} failed:`, err.message);
            outputs[outputType] = null;
            errors[outputType]  = err.message;
        }
    }

    return { outputs, errors };
}

module.exports = { generate };
