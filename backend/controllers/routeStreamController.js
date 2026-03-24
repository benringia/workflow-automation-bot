const fs = require('fs');
const path = require('path');
const { sendPrompt } = require('../services/claudeService');
const { detectSteps, describeIntent, STEP_CONFIG } = require('./routeController');

const CHUNK_SIZE = 200;
const CHUNK_DELAY_MS = 10;

function sendEvent(res, eventType, payload) {
    res.write(`event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`);
}

function buildPrompt(stepName, stepInput) {
    const config = STEP_CONFIG[stepName];
    const promptPath = path.join(__dirname, `../../prompts/${config.file}`);
    if (!fs.existsSync(promptPath)) return null;
    const template = fs.readFileSync(promptPath, 'utf-8');
    const re = new RegExp(config.placeholder.replace(/[{}]/g, '\\$&'), 'g');
    return template.replace(re, stepInput);
}

async function streamChunks(res, stepName, fullText) {
    for (let offset = 0; offset < fullText.length; offset += CHUNK_SIZE) {
        sendEvent(res, 'chunk', { step: stepName, chunk: fullText.slice(offset, offset + CHUNK_SIZE) });
        await new Promise(r => setTimeout(r, CHUNK_DELAY_MS));
    }
}

async function handleRouteStream(req, res) {
    const { input } = req.body || {};
    if (!input || typeof input !== 'string') {
        return res.status(400).json({ success: false, error: 'Input is required and must be a string' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const detectedSteps = detectSteps(input);
    const intent = describeIntent(detectedSteps);
    const stepInput = input.trim().slice(0, 8000);

    sendEvent(res, 'init', { intent, detectedSteps });

    for (const stepName of detectedSteps) {
        sendEvent(res, 'step-start', { step: stepName });
        try {
            const prompt = buildPrompt(stepName, stepInput);
            if (!prompt) {
                sendEvent(res, 'step-error', { step: stepName, error: `Prompt template not found for ${stepName}` });
                continue;
            }
            const result = await sendPrompt(prompt);
            if (!result || result.length < 50) {
                sendEvent(res, 'step-error', { step: stepName, error: `Incomplete response (${result?.length ?? 0} chars)` });
                continue;
            }
            await streamChunks(res, stepName, result);
            sendEvent(res, 'step-complete', { step: stepName });
        } catch (err) {
            console.error(`[routeStreamController] ${stepName}:`, err.message, err.response?.data || '');
            sendEvent(res, 'step-error', { step: stepName, error: err.message || 'Unknown error' });
        }
    }

    sendEvent(res, 'done', { intent, detectedSteps });
    res.end();
}

module.exports = { handleRouteStream };
