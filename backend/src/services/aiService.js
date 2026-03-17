const axios = require('axios');

/**
 * Sends a prompt to the Ollama API and returns the AI response text.
 * @param {string} prompt - The fully built prompt string.
 * @returns {Promise<string>} - Raw text response from the AI model.
 */
const analyzeCode = async (prompt, systemPrompt = null) => {
  try {
    const body = {
      model: process.env.AI_MODEL,
      prompt,
      stream: false,
      options: {
        temperature: 0.1,
        num_predict: 2048,
      },
    };

    if (systemPrompt) body.system = systemPrompt;

    const response = await axios.post(process.env.OLLAMA_API, body, {
      timeout: 120000,
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.data || !response.data.response) {
      throw new Error('Empty or invalid response from Ollama');
    }

    return response.data.response;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      throw new Error(
        'Cannot connect to Ollama. Make sure it is running at ' + process.env.OLLAMA_API
      );
    }
    if (error.code === 'ECONNABORTED') {
      throw new Error('Ollama request timed out. The model may be loading.');
    }
    throw new Error(`AI service error: ${error.message}`);
  }
};

module.exports = { analyzeCode };
