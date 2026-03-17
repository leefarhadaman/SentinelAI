/**
 * Builds the AI prompt for single code snippet review.
 */
const buildPrompt = (code, language) => {
  return `You are a senior software engineer performing a professional code review.

Analyze the following ${language} code thoroughly.

You MUST return ONLY a valid JSON object — no explanation, no markdown, no code fences.

The JSON must follow this exact structure:
{
  "issues": ["string describing each issue"],
  "security": ["string describing each security vulnerability"],
  "suggestions": ["string describing each improvement suggestion"],
  "optimizedCode": "the full improved version of the code as a string"
}

Rules:
- If there are no items in a category, return an empty array [].
- The "optimizedCode" field must always contain a valid, runnable version of the code.
- Do not include any text outside the JSON object.
- Do not wrap the JSON in markdown backticks.

Language: ${language}

Code to review:
\`\`\`${language}
${code}
\`\`\``;
};

/**
 * Builds the AI prompt for full SentinelAI repo file analysis.
 * Returns structured per-issue report with severity, category, explanation, fix.
 */
const SCAN_SYSTEM_PROMPT = 'You are a code security and quality analyzer. You ONLY respond with valid JSON. Never add explanation or text outside the JSON object.';

const buildScanPrompt = (code, language, fileName) => {
  const prompt = `Analyze this ${language} code from file "${fileName}" for bugs, security vulnerabilities, performance issues, and bad practices.

Respond with this exact JSON structure:
{"issues":[{"issueType":"string","severity":"critical|high|medium|low|info","category":"bug|security|performance|quality","explanation":"string","suggestedFix":"string"}],"optimizedCode":"string","scores":{"security":0,"maintainability":0,"performance":0}}

Rules:
- severity: critical, high, medium, low, or info
- category: bug, security, performance, or quality  
- scores are integers 0-10
- optimizedCode is the full improved file as a string
- issues is empty array [] if code is clean

Code:
\`\`\`${language}
${code}
\`\`\``;

  return { prompt, system: SCAN_SYSTEM_PROMPT };
};

module.exports = { buildPrompt, buildScanPrompt };
