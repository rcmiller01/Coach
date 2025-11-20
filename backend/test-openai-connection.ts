import * as dotenv from 'dotenv';
dotenv.config();

import OpenAI from 'openai';

async function testOpenAI() {
  try {
    console.log('Testing OpenAI connection...');
    console.log(`API Key: ${process.env.OPENAI_API_KEY?.substring(0, 20)}...`);
    console.log(`Model: ${process.env.OPENAI_MODEL}`);
    
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    console.log('Client created successfully');
    
    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Say hello in JSON format: {"message": "..."}' }],
      temperature: 0.3,
    });
    
    console.log('✅ OpenAI API call successful!');
    console.log('Response:', response.choices[0].message.content);
    
  } catch (error) {
    console.error('❌ OpenAI API call failed:');
    console.error(error);
    process.exit(1);
  }
}

testOpenAI();
