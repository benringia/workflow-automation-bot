const axios = require('axios');

/**
 * Sends a prompt to the Claude API and returns the response text.
 * @param {string} prompt - The user prompt to send.
 * @returns {Promise<string>} - The response text from Claude.
 */
async function sendPrompt(prompt) {
    if (!process.env.CLAUDE_API_KEY) {
        throw new Error("CLAUDE_API_KEY is not defined in environment variables");
    }

    const url = 'https://api.anthropic.com/v1/messages';
    
    try {
        const response = await axios.post(
            url,
            {
                model: "claude-3-sonnet-20240229",
                max_tokens: 500,
                messages: [
                    { 
                        role: "user", 
                        content: prompt 
                    }
                ]
            },
            {
                headers: {
                    'x-api-key': process.env.CLAUDE_API_KEY,
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json'
                }
            }
        );

        // Extract and return ONLY the response text
        if (response.data && response.data.content && response.data.content[0]) {
            return response.data.content[0].text;
        }
        
        throw new Error('Unexpected response format from Claude API');
    } catch (error) {
        const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
        console.error('Claude API Error:', errorMessage);
        throw new Error(`Failed to get response from Claude service: ${errorMessage}`);
    }
}

module.exports = {
    sendPrompt
};
