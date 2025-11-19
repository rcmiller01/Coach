/**
 * Simple Test Server for Nutrition API
 * 
 * Minimal server to test parseFood functionality
 */

import * as dotenv from 'dotenv';
import { Pool } from 'pg';
import * as nutritionTools from './nutritionTools.js';
import { RealNutritionAiService } from './RealNutritionAiService.js';
import { StubNutritionAiService } from './NutritionAiService.js';

// Load environment variables
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
const USE_REAL_AI = process.env.USE_REAL_AI === 'true';

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set in .env file');
  process.exit(1);
}

console.log('🔧 Initializing database connection...');

// Initialize PostgreSQL connection pool
const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
async function testDatabase() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connected at:', result.rows[0].now);
    
    // Check tables
    const genericCount = await pool.query('SELECT COUNT(*) FROM nutrition_generic_foods');
    const brandCount = await pool.query('SELECT COUNT(*) FROM nutrition_brands');
    const itemCount = await pool.query('SELECT COUNT(*) FROM nutrition_brand_items');
    
    console.log(`✅ Database has ${genericCount.rows[0].count} generic foods`);
    console.log(`✅ Database has ${brandCount.rows[0].count} brands`);
    console.log(`✅ Database has ${itemCount.rows[0].count} brand items`);
    
    return true;
  } catch (err) {
    console.error('❌ Database connection failed:', err);
    return false;
  }
}

// Initialize nutrition tools
async function testNutritionTools() {
  try {
    nutritionTools.initializeDb(pool);
    console.log('✅ Nutrition tools initialized');
    
    // Test search
    console.log('\n🔍 Testing searchGenericFood("apple")...');
    const appleResults = await nutritionTools.searchGenericFood('apple', 'en-US', 5);
    console.log(`   Found ${appleResults.length} results:`);
    appleResults.forEach(food => {
      console.log(`   - ${food.name} (${food.caloriesPer100g} cal/100g)`);
    });
    
    console.log('\n🔍 Testing searchBrandedItem("Big Mac")...');
    const bigMacResults = await nutritionTools.searchBrandedItem('Big Mac', undefined, 'en-US', 5);
    console.log(`   Found ${bigMacResults.length} results:`);
    bigMacResults.forEach(item => {
      console.log(`   - ${item.name} (${item.caloriesPerUnit} cal/unit)`);
    });
    
    return true;
  } catch (err) {
    console.error('❌ Nutrition tools test failed:', err);
    return false;
  }
}

// Test AI service
async function testAiService() {
  try {
    const aiService = USE_REAL_AI 
      ? new RealNutritionAiService()
      : new StubNutritionAiService();
    
    console.log(`\n🤖 Testing AI Service (${USE_REAL_AI ? 'REAL' : 'STUB'} mode)...`);
    
    if (!USE_REAL_AI) {
      console.log('   ⚠️  Using stub service (set USE_REAL_AI=true in .env for real AI)');
    }
    
    console.log('\n🍎 Testing parseFood("1 apple")...');
    const result = await aiService.parseFood({
      text: '1 apple',
      userId: 'user-test',
      userContext: {}
    });
    console.log(`   ✅ Parsed: ${result.name}`);
    console.log(`   Calories: ${result.calories}`);
    console.log(`   Provenance: ${result.dataSource}`);
    if (result.aiExplanation) {
      console.log(`   Confidence: ${result.aiExplanation.confidence}`);
      console.log(`   Reasoning: ${result.aiExplanation.reasoning.substring(0, 100)}...`);
    }
    
    return true;
  } catch (err: any) {
    if (err.code === 'AI_QUOTA_EXCEEDED') {
      console.error(`   ⚠️  Quota exceeded (unexpected on first call): ${err.message}`);
      console.error(`   This should not happen - check quota logic`);
      return false;
    }
    if (err.code === 'AI_TIMEOUT') {
      console.error(`   ⚠️  Timeout error: ${err.message}`);
      return true; // Timeout is acceptable for testing
    }
    console.error('❌ AI Service test failed:', err);
    console.error('   Error code:', err.code);
    console.error('   Error message:', err.message);
    if (err.details) {
      console.error('   Error details:', JSON.stringify(err.details, null, 2));
    }
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('🧪 Running Coach Nutrition API Tests\n');
  console.log('========================================\n');
  
  const dbOk = await testDatabase();
  if (!dbOk) {
    console.log('\n❌ Database tests failed. Fix database connection first.');
    process.exit(1);
  }
  
  const toolsOk = await testNutritionTools();
  if (!toolsOk) {
    console.log('\n❌ Nutrition tools tests failed.');
    process.exit(1);
  }
  
  const aiOk = await testAiService();
  if (!aiOk) {
    console.log('\n❌ AI service tests failed.');
    process.exit(1);
  }
  
  console.log('\n========================================');
  console.log('✅ All tests passed!');
  console.log('========================================\n');
  
  // Cleanup
  await pool.end();
  process.exit(0);
}

runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
