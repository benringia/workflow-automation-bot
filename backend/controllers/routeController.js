const fs = require('fs');
const path = require('path');
const { sendPrompt } = require('../services/claudeService');

const STEP_CONFIG = {
    'debug':            { file: 'debug.md',            placeholder: '{{code_snippet_or_error}}' },
    'refactor':         { file: 'refactor.md',          placeholder: '{{code_snippet}}' },
    'generate-feature': { file: 'generate-feature.md',  placeholder: '{{feature_description}}' },
    'explain-code':     { file: 'explain-code.md',      placeholder: '{{code_snippet}}' }
};

const PRIORITY = ['generate-feature', 'debug', 'refactor', 'explain-code'];

function looksLikeCode(input) {
    return /const|let|var|function|=>|\{|\}|class |import |require\(/.test(input);
}

function describeIntent(steps) {
    if (steps.includes('generate-feature') && steps.includes('explain-code'))
        return 'Build a feature and understand it';
    if (steps.includes('generate-feature') && steps.includes('debug'))
        return 'Build a feature and fix issues';
    if (steps.includes('generate-feature'))
        return 'Build or design a new feature';
    if (steps.includes('debug'))
        return 'Debug or fix an issue';
    if (steps.includes('refactor'))
        return 'Improve or clean up code';
    if (steps.includes('explain-code'))
        return 'Explain code or a concept';
    return 'General request';
}

function detectSteps(input) {
    const lower = input.toLowerCase();
    const matched = [];

    if (/error|fix|bug|issue|broken|crash|fail|undefined|null/.test(lower))
        matched.push('debug');
    if (/refactor|clean|improve|optimize|simplify|restructure/.test(lower))
        matched.push('refactor');
    if (/build|create|add|feature|implement|make|generate|design/.test(lower))
        matched.push('generate-feature');
    if (/explain|what does|how does|understand|describe|walk me through/.test(lower))
        matched.push('explain-code');

    if (matched.length === 0) {
        return looksLikeCode(input) ? ['debug'] : ['generate-feature'];
    }

    return PRIORITY.filter(step => matched.includes(step));
}

function extractCode(text) {
    const matches = [...text.matchAll(/```(?:\w+)?\n?([\s\S]*?)```/g)];
    return matches.length ? matches.map(m => m[1].trim()).join('\n\n') : null;
}

function extractPlan(text) {
    const match = text.match(/(?:##\s*Plan|1\.\s*Plan)([\s\S]*?)(?:##|2\.|$)/i);
    return match ? match[1].trim() : null;
}

function extractExplanation(text) {
    const match = text.match(/(?:##\s*(?:Explanation|Summary|Understanding))([\s\S]*?)(?:##|$)/i);
    return match ? match[1].trim() : null;
}

function extractData(result) {
    return {
        code:        extractCode(result),
        plan:        extractPlan(result),
        explanation: extractExplanation(result)
    };
}

async function handleRoute(req, res) {
    const { input } = req.body || {};

    if (!input || typeof input !== 'string') {
        return res.status(400).json({ success: false, error: 'Input is required' });
    }

    const detectedSteps = detectSteps(input);
    const intent = describeIntent(detectedSteps);
    const stepInput = input.trim().slice(0, 8000);

    const stepPromises = detectedSteps.map(async (stepName) => {
        const config = STEP_CONFIG[stepName];
        const promptPath = path.join(__dirname, `../../prompts/${config.file}`);

        if (!fs.existsSync(promptPath)) {
            return { step: stepName, input: stepInput, error: `Prompt template not found for ${stepName}`, meta: { length: 0 } };
        }

        const template = fs.readFileSync(promptPath, 'utf-8');
        const placeholderRegex = new RegExp(config.placeholder.replace(/[{}]/g, '\\$&'), 'g');
        const finalPrompt = template.replace(placeholderRegex, stepInput);
        const result = await sendPrompt(finalPrompt);

        console.log(`[${stepName}] response length: ${result ? result.length : 0}`);

        if (!result || result.length < 50) {
            throw new Error(`Claude returned incomplete response for step "${stepName}" (${result ? result.length : 0} chars)`);
        }

        const extracted = extractData(result);
        return {
            step: stepName,
            input: stepInput,
            result,
            meta: {
                length: result.length,
                extracted: {
                    hasCode:        !!extracted.code,
                    hasPlan:        !!extracted.plan,
                    hasExplanation: !!extracted.explanation
                }
            }
        };
    });

    const settled = await Promise.allSettled(stepPromises);

    const results = settled.map((outcome, i) => {
        if (outcome.status === 'fulfilled') return outcome.value;
        const stepName = detectedSteps[i];
        console.error(`Route Controller Error [${stepName}]:`, outcome.reason?.message);
        return { step: stepName, input: stepInput, error: outcome.reason?.message || 'Unknown error', meta: { length: 0 } };
    });

    res.json({ success: true, intent, detectedSteps, steps: results });
}

module.exports = { handleRoute };
