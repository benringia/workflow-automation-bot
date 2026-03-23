const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini SDK with API Key from process environment
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Sends a prompt to the Gemini AI using the official SDK and returns the resulting text.
 * Implements retry logic and error handling for rate limit (429) errors.
 * @param {string} prompt - The user prompt to send.
 * @param {number} retryCount - Current retry attempt count.
 * @returns {Promise<string>} - The response text from Gemini.
 */
async function sendPrompt(prompt, retryCount = 0) {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not defined in environment variables");
    }

    try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.0-flash",
            // Limit output tokens to reduce response size and latency
            generationConfig: {
                maxOutputTokens: 1000,
            }
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;

        return response.text();
    } catch (error) {
        // Handle 429 Too Many Requests errors
        if (error.message && error.message.includes("429") && retryCount < 1) {
            console.warn("Gemini Rate Limit hit. Retrying in 2 seconds...");
            await new Promise(resolve => setTimeout(resolve, 2000));
            return sendPrompt(prompt, retryCount + 1);
        }

        if (error.message && error.message.includes("429")) {
            throw new Error("Gemini rate limit exceeded. Please wait and try again.");
        }

        console.error("Gemini Service Error:", error.message);
        throw new Error("An error occurred while communicating with the Gemini AI service.");
    }
}

module.exports = {
    sendPrompt
};
