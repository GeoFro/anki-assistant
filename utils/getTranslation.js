const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function getTranslation(nativeText) {
  try {
    const response = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: `Translate the following ${process.env.NATIVE_LANGUAGE} text to ${process.env.TARGET_LANGUAGE}. Words in brackets () are for context only. Only provide the ${process.env.TARGET_LANGUAGE} translation, nothing else: "${nativeText}"`
      }]
    });

    const responseText = response.content[0].text.trim().replace(/"/g, '');

    return responseText;
  } catch (error) {
    console.error('Error getting translation from Anthropic:', error.message);
    throw error;
  }
}

module.exports = getTranslation;
