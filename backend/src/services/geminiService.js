const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI;

function getGeminiClient() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('Warning: GEMINI_API_KEY is not defined in environment variables.');
    }
    genAI = new GoogleGenerativeAI(apiKey || 'dummy_key');
  }
  return genAI;
}

/**
 * Summarize an email thread.
 * @param {string} threadContent - Concatenated string of thread messages.
 * @returns {Promise<string>} Three-sentence summary.
 */
async function summarizeThread(threadContent) {
  try {
    const ai = getGeminiClient();
    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `You are a concise email assistant. Summarize the following email thread in exactly 3 sentences. 
Focus on: what was asked, what was decided, and what needs to happen next.

Thread:
${threadContent}

Summary:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Gemini summarize error:', error);
    throw new Error('Failed to generate summary.');
  }
}

/**
 * Generate email draft replies.
 * @param {string} threadContent - Thread context.
 * @param {string} tone - formal/casual/urgent/apologetic/assertive.
 * @returns {Promise<string>} Generated drafts.
 */
async function generateDrafts(threadContent, tone = 'formal') {
  try {
    const ai = getGeminiClient();
    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `You are an email assistant. Generate 2 draft replies to this email thread.
Match the sender's tone: ${tone} (formal/casual/urgent).
Each reply should be concise, professional, and under 150 words.

Thread:
${threadContent}

Draft 1 (direct):
Draft 2 (warmer):`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Gemini draft error:', error);
    throw new Error('Failed to generate drafts.');
  }
}

/**
 * Suggest follow-up actions.
 * @param {string} threadContent - Thread context.
 * @returns {Promise<string>} Actions as a bulleted list.
 */
async function suggestFollowups(threadContent) {
  try {
    const ai = getGeminiClient();
    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `Based on this email thread, suggest 2-3 follow-up actions the recipient should take.
Format as a short bullet list. Be specific and actionable.

Thread:
${threadContent}

Follow-up actions:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Gemini followups error:', error);
    throw new Error('Failed to suggest followups.');
  }
}

/**
 * Classify email urgency and intent.
 * @param {string} threadContent - Thread context.
 * @returns {Promise<{ urgency: string, intent: string }>} Urgency and intent classification.
 */
async function classifyThread(threadContent) {
  try {
    const ai = getGeminiClient();
    const model = ai.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      }
    });
    const prompt = `Classify this email thread on two dimensions:
- Urgency: Low / Medium / High / Critical
- Intent: Question / Request / Update / Action Required / FYI

Provide your output in valid JSON format matching this schema:
{
  "urgency": "Low" | "Medium" | "High" | "Critical",
  "intent": "Question" | "Request" | "Update" | "Action Required" | "FYI"
}

Thread:
${threadContent}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const data = JSON.parse(response.text().trim());
    return data;
  } catch (error) {
    console.error('Gemini classify error:', error);
    // Return fallback
    return { urgency: 'Medium', intent: 'Update' };
  }
}

module.exports = {
  summarizeThread,
  generateDrafts,
  suggestFollowups,
  classifyThread
};
