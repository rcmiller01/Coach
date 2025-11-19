import * as dotenv from 'dotenv';
dotenv.config();

import OpenAI from 'openai';

const USE_OPENROUTER = process.env.USE_OPENROUTER === 'true';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

console.log('USE_OPENROUTER:', USE_OPENROUTER);
console.log('API_KEY exists:', !!OPENROUTER_API_KEY);
console.log('API_KEY length:', OPENROUTER_API_KEY.length);
console.log('MODEL:', OPENROUTER_MODEL);

if (USE_OPENROUTER && OPENROUTER_API_KEY) {
  const client = new OpenAI({
    apiKey: OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': 'https://github.com/rcmiller01/coach',
      'X-Title': 'AI Workout Coach - Nutrition Test',
    },
  });

  console.log('✅ OpenAI client created');

  // Try a simple chat completion
  client.chat.completions.create({
    model: OPENROUTER_MODEL,
    messages: [{ role: 'user', content: 'Say hello' }],
    max_tokens: 20,
  }).then(response => {
    console.log('✅ API call successful!');
    console.log('Response:', response.choices[0].message.content);
  }).catch(error => {
    console.error('❌ API call failed:', error.message);
    console.error('Status:', error.status);
    console.error('Code:', error.code);
  });
} else {
  console.error('❌ Missing configuration');
}
