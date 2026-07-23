const { GoogleGenerativeAI } = require("@google/generative-ai");

function formatPrompt(payload) {
  return [
    "You are an operations analyst for a queue management system.",
    "Generate concise natural-language insights with these sections:",
    "1) Peak hours",
    "2) Average wait time changes",
    "3) Bottlenecks",
    "4) Recommendations",
    "Keep output under 220 words and use plain, practical language.",
    "Queue analytics JSON:",
    JSON.stringify(payload),
  ].join("\n");
}

async function generateQueueInsights(payload) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({ model: modelName });

  const result = await model.generateContent(formatPrompt(payload));
  const text = result?.response?.text?.();
  if (!text) {
    throw new Error("Gemini returned an empty response");
  }

  return {
    insightText: text.trim(),
    model: modelName,
  };
}

module.exports = {
  generateQueueInsights,
};
