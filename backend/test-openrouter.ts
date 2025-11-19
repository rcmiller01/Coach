/**
 * Quick test to verify OpenRouter API key works
 */

import * as dotenv from 'dotenv';
dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

async function testOpenRouterDirect() {
  console.log('Testing OpenRouter API directly...\n');
  
  // Debug: Check all environment variables
  const allKeys = Object.keys(process.env).filter(k => k.includes('OPEN'));
  console.log('Environment variables with OPEN:', allKeys);
  allKeys.forEach(k => {
    console.log(`  ${k} = "${process.env[k]?.substring(0, 30)}..." (length: ${process.env[k]?.length})`);
  });
  
  console.log(`\nFull key from env:`);
  console.log(process.env.OPENROUTER_API_KEY);
  
  const trimmedKey = process.env.OPENROUTER_API_KEY?.trim();
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${trimmedKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/rcmiller01/coach',
        'X-Title': 'AI Workout Coach - Nutrition Test',
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo',
        messages: [
          { role: 'user', content: 'Say "Hello from OpenRouter!" and nothing else.' }
        ],
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Error:', response.status, response.statusText);
      console.error('Response:', JSON.stringify(data, null, 2));
    } else {
      console.log('✅ Success!');
      console.log('Response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ Fetch failed:', error);
  }
}

testOpenRouterDirect();
