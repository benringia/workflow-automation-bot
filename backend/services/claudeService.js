const axios = require('axios');

const PRIMARY_MODEL = 'claude-sonnet-4-6';
const FALLBACK_MODEL = 'claude-3-haiku-20240307';

async function callClaude(prompt, model) {
    const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
            model,
            max_tokens: 500,
            messages: [{ role: 'user', content: prompt }]
        },
        {
            headers: {
                'x-api-key': process.env.CLAUDE_API_KEY,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
            }
        }
    );

    if (response.data && response.data.content && response.data.content[0]) {
        return response.data.content[0].text;
    }

    throw new Error('Unexpected response format from Claude API');
}

async function sendPrompt(prompt) {
    if (!process.env.CLAUDE_API_KEY) {
        throw new Error('CLAUDE_API_KEY is not defined in environment variables');
    }

    try {
        return await callClaude(prompt, PRIMARY_MODEL);
    } catch (error) {
        const isNotFound = error.response?.data?.error?.type === 'not_found_error';

        if (isNotFound) {
            console.warn(`Model ${PRIMARY_MODEL} not found, falling back to ${FALLBACK_MODEL}`);
            try {
                return await callClaude(prompt, FALLBACK_MODEL);
            } catch (fallbackError) {
                const msg = fallbackError.response ? JSON.stringify(fallbackError.response.data) : fallbackError.message;
                console.error('Claude API Fallback Error:', msg);
                throw new Error(`Failed to get response from Claude service: ${msg}`);
            }
        }

        const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
        console.error('Claude API Error:', errorMessage);
        throw new Error(`Failed to get response from Claude service: ${errorMessage}`);
    }
}

module.exports = {
    sendPrompt
};
