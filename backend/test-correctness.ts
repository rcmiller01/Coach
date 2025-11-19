/**
 * Phase 2: Correctness Testing
 * 
 * Comprehensive edge-case testing for parseFood
 */

import * as dotenv from 'dotenv';
import { Pool } from 'pg';
import * as nutritionTools from './nutritionTools.js';
import { RealNutritionAiService } from './RealNutritionAiService.js';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
const USE_REAL_AI = process.env.USE_REAL_AI === 'true';

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set');
  process.exit(1);
}

// Initialize database
const pool = new Pool({ connectionString: DATABASE_URL });
nutritionTools.initializeDb(pool);

const aiService = new RealNutritionAiService();

// Test cases organized by category
const testCases = {
  'Simple Generic Foods': [
    '1 apple',
    '1 banana',
    '2 eggs',
    '6oz chicken breast',
  ],
  
  'Branded Items': [
    'Big Mac',
    'Subway Italian BMT 6 inch',
    'Chipotle chicken burrito bowl',
    'Starbucks grande latte',
  ],
  
  'Vague Portions': [
    'a bowl of cereal with milk',
    'a plate of spaghetti',
    'a handful of almonds',
    'some peanut butter',
  ],
  
  'Adjective Soup': [
    'dirty chai with oat milk, iced, venti',
    'loaded fries with cheese and bacon',
    'skinless grilled chicken breast',
  ],
  
  'Brand + Modifiers': [
    "McDonald's Big Mac no sauce",
    'Starbucks grande caramel macchiato with skim milk',
    'Chipotle burrito bowl no rice extra chicken',
  ],
  
  'Regional/Style Foods': [
    'chicken shawarma wrap',
    'small doner kebab with garlic sauce',
    'pho with beef and noodles',
  ],
};

interface TestResult {
  input: string;
  success: boolean;
  name?: string;
  calories?: number;
  provenance?: string;
  confidence?: string;
  reasoning?: string;
  error?: string;
  duration?: number;
}

async function testParseFood(text: string): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    const result = await aiService.parseFood({
      text,
      userId: 'test-user',
      userContext: { locale: 'en-US' }
    });
    
    const duration = Date.now() - startTime;
    
    return {
      input: text,
      success: true,
      name: result.name,
      calories: result.calories,
      provenance: result.dataSource,
      confidence: result.aiExplanation?.confidence,
      reasoning: result.aiExplanation?.reasoning,
      duration,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    return {
      input: text,
      success: false,
      error: `${error.code}: ${error.message}`,
      duration,
    };
  }
}

async function runCorrectnessTests() {
  console.log('🧪 Phase 2: Correctness Testing\n');
  console.log('========================================\n');
  
  if (!USE_REAL_AI) {
    console.log('⚠️  USE_REAL_AI=false - using stub service');
    console.log('   Set USE_REAL_AI=true in .env to test real AI\n');
  }
  
  const allResults: TestResult[] = [];
  
  for (const [category, tests] of Object.entries(testCases)) {
    console.log(`\n📋 ${category}`);
    console.log('─'.repeat(60));
    
    for (const testInput of tests) {
      process.stdout.write(`  Testing: "${testInput}"...`);
      
      const result = await testParseFood(testInput);
      allResults.push(result);
      
      if (result.success) {
        console.log(` ✅ ${result.duration}ms`);
        console.log(`    → ${result.name} (${result.calories} cal)`);
        console.log(`    → Provenance: ${result.provenance}, Confidence: ${result.confidence}`);
      } else {
        console.log(` ❌`);
        console.log(`    → Error: ${result.error}`);
      }
    }
  }
  
  // Summary
  console.log('\n');
  console.log('========================================');
  console.log('📊 Test Summary');
  console.log('========================================\n');
  
  const successful = allResults.filter(r => r.success).length;
  const failed = allResults.filter(r => r.success === false).length;
  const total = allResults.length;
  
  console.log(`Total tests: ${total}`);
  console.log(`✅ Passed: ${successful} (${Math.round(successful/total*100)}%)`);
  console.log(`❌ Failed: ${failed} (${Math.round(failed/total*100)}%)`);
  
  if (successful > 0) {
    const avgDuration = allResults
      .filter(r => r.success && r.duration)
      .reduce((sum, r) => sum + r.duration!, 0) / successful;
    console.log(`⏱️  Average duration: ${Math.round(avgDuration)}ms`);
  }
  
  // Provenance breakdown
  if (successful > 0) {
    const official = allResults.filter(r => r.provenance === 'official').length;
    const estimated = allResults.filter(r => r.provenance === 'estimated').length;
    
    console.log(`\n📦 Provenance:`);
    console.log(`   Official: ${official}`);
    console.log(`   Estimated: ${estimated}`);
  }
  
  // Confidence breakdown
  if (successful > 0) {
    const high = allResults.filter(r => r.confidence === 'high').length;
    const medium = allResults.filter(r => r.confidence === 'medium').length;
    const low = allResults.filter(r => r.confidence === 'low').length;
    
    console.log(`\n🎯 Confidence:`);
    console.log(`   High: ${high}`);
    console.log(`   Medium: ${medium}`);
    console.log(`   Low: ${low}`);
  }
  
  // Export results to JSON
  const fs = await import('fs/promises');
  await fs.writeFile(
    'correctness-test-results.json',
    JSON.stringify(allResults, null, 2)
  );
  console.log('\n💾 Full results saved to: correctness-test-results.json');
  
  await pool.end();
  
  if (failed > 0 && USE_REAL_AI) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runCorrectnessTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
